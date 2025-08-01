// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ILocalNotification } from '@awesome-cordova-plugins/local-notifications';

import { CoreAppDB } from '@services/app-db';
import { CoreConfig } from '@services/config';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreText } from '@singletons/text';
import { CoreQueueRunner } from '@classes/queue-runner';
import { CoreError } from '@classes/errors/error';
import { CoreConstants } from '@/core/constants';
import { makeSingleton, NgZone, Translate, LocalNotifications, ApplicationInit } from '@singletons';
import { CoreLogger } from '@singletons/logger';
import {
    APP_SCHEMA,
    TRIGGERED_TABLE_NAME,
    COMPONENTS_TABLE_NAME,
    LOCAL_NOTIFICATIONS_SITES_TABLE_NAME,
    CodeRequestsQueueItem,
    CoreLocalNotificationsTriggeredDBRecord,
    CoreLocalNotificationsComponentsDBRecord,
    CoreLocalNotificationsSitesDBRecord,
} from '@services/database/local-notifications';
import { CorePromisedValue } from '@classes/promised-value';
import { CorePlatform } from '@services/platform';
import { Push } from '@features/native/plugins';
import { AsyncInstance, asyncInstance } from '@/core/utils/async-instance';
import { CoreDatabaseTable } from '@classes/database/database-table';
import { CoreDatabaseCachingStrategy, CoreDatabaseTableProxy } from '@classes/database/database-table-proxy';
import { CoreSites } from './sites';
import { CoreNavigator } from './navigator';
import { CoreWait } from '@singletons/wait';
import { CoreAlerts } from './overlays/alerts';

/**
 * Service to handle local notifications.
 */
@Injectable({ providedIn: 'root' })
export class CoreLocalNotificationsProvider {

    protected logger: CoreLogger;
    protected codes: { [s: string]: number } = {};
    protected codeRequestsQueue: {[key: string]: CodeRequestsQueueItem} = {};
    protected observables: {[eventName: string]: {[component: string]: Subject<unknown>}} = {};

    protected triggerSubscription?: Subscription;
    protected clickSubscription?: Subscription;
    protected clearSubscription?: Subscription;
    protected cancelSubscription?: Subscription;
    protected addSubscription?: Subscription;
    protected updateSubscription?: Subscription;
    protected queueRunner: CoreQueueRunner; // Queue to decrease the number of concurrent calls to the plugin (see MOBILE-3477).

    protected sitesTable = asyncInstance<CoreDatabaseTable<CoreLocalNotificationsSitesDBRecord, 'id', never>>();
    protected componentsTable = asyncInstance<CoreDatabaseTable<CoreLocalNotificationsComponentsDBRecord, 'id', never>>();
    protected triggeredTable = asyncInstance<CoreDatabaseTable<CoreLocalNotificationsTriggeredDBRecord>>();

    constructor() {
        this.logger = CoreLogger.getInstance('CoreLocalNotificationsProvider');
        this.queueRunner = new CoreQueueRunner(10);
    }

    /**
     * Init some properties.
     */
    async initialize(): Promise<void> {
        await CorePlatform.ready();

        // Request permission when the app starts.
        LocalNotifications.requestPermission();

        // Listen to events.
        this.triggerSubscription = LocalNotifications.on('trigger').subscribe((notification: ILocalNotification) => {
            this.trigger(notification);

            this.handleEvent('trigger', notification);
        });

        this.clickSubscription = LocalNotifications.on('click').subscribe(async (notification: ILocalNotification) => {
            await ApplicationInit.donePromise;

            // This code is also done when clicking push notifications. If it's modified, it should be modified in there too.
            if (CoreSites.isLoggedIn()) {
                CoreSites.runAfterLoginNavigation({
                    priority: 0, // Use a low priority because the execution of this process doesn't block the next ones.
                    callback: async () => {
                        this.handleEvent('click', notification);
                    },
                });

                return;
            }

            // User not logged in, wait for the path to be a "valid" path (not a parent path used when starting the app).
            await CoreWait.waitFor(() => {
                const currentPath = CoreNavigator.getCurrentPath();

                return currentPath !== '/' && currentPath !== '/login';
            }, { timeout: 400 });

            this.handleEvent('click', notification);
        });

        this.clearSubscription = LocalNotifications.on('clear').subscribe((notification: ILocalNotification) => {
            this.handleEvent('clear', notification);
        });

        this.cancelSubscription = LocalNotifications.on('cancel').subscribe((notification: ILocalNotification) => {
            this.handleEvent('cancel', notification);
        });

        this.addSubscription = LocalNotifications.on('schedule').subscribe((notification: ILocalNotification) => {
            this.handleEvent('schedule', notification);
        });

        this.updateSubscription = LocalNotifications.on('update').subscribe((notification: ILocalNotification) => {
            this.handleEvent('update', notification);
        });

        // Create the default channel for local notifications.
        this.createDefaultChannel();

        Translate.onLangChange.subscribe(() => {
            // Update the channel name.
            this.createDefaultChannel();
        });

        CoreEvents.on(CoreEvents.SITE_DELETED, (site) => {
            if (site?.id) {
                this.cancelSiteNotifications(site.id);
            }
        });

        CoreEvents.on(CoreEvents.LOGIN, async () => {
            const [hasNotificationsPermission, canScheduleExact] = await Promise.all([
                this.hasNotificationsPermission(),
                this.canScheduleExactAlarms(),
            ]);

            if (!hasNotificationsPermission || canScheduleExact) {
                return;
            }

            const dontShowWarning = await CoreConfig.get(CoreConstants.EXACT_ALARMS_WARNING_DISPLAYED, 0);
            if (dontShowWarning) {
                return;
            }

            CoreAlerts.show({
                header: Translate.instant('core.turnonexactalarms'),
                message: Translate.instant('core.exactalarmsturnedoffmessage'),
                buttons: [
                    {
                        text: Translate.instant('core.notnow'),
                        role: 'cancel',
                    },
                    {
                        text: Translate.instant('core.turnon'),
                        handler: (): void => {
                            this.openAlarmSettings();
                        },
                    },
                ],
            });

            CoreConfig.set(CoreConstants.EXACT_ALARMS_WARNING_DISPLAYED, 1);
        });
    }

    /**
     * Initialize database.
     */
    async initializeDatabase(): Promise<void> {
        await CoreAppDB.createTablesFromSchema(APP_SCHEMA);

        const database = CoreAppDB.getDB();
        const sitesTable = new CoreDatabaseTableProxy<CoreLocalNotificationsSitesDBRecord, 'id', never>(
            { cachingStrategy: CoreDatabaseCachingStrategy.None },
            database,
            LOCAL_NOTIFICATIONS_SITES_TABLE_NAME,
            ['id'],
            null,
        );
        const componentsTable = new CoreDatabaseTableProxy<CoreLocalNotificationsComponentsDBRecord, 'id', never>(
            { cachingStrategy: CoreDatabaseCachingStrategy.None },
            database,
            COMPONENTS_TABLE_NAME,
            ['id'],
            null,
        );
        const triggeredTable = new CoreDatabaseTableProxy<CoreLocalNotificationsTriggeredDBRecord>(
            { cachingStrategy: CoreDatabaseCachingStrategy.None },
            database,
            TRIGGERED_TABLE_NAME,
        );

        await Promise.all([
            sitesTable.initialize(),
            componentsTable.initialize(),
            triggeredTable.initialize(),
        ]);

        this.sitesTable.setInstance(sitesTable);
        this.componentsTable.setInstance(componentsTable);
        this.triggeredTable.setInstance(triggeredTable);
    }

    /**
     * Check whether the app has the permission to display notifications.
     *
     * @returns Whether has notifications permission.
     */
    async hasNotificationsPermission(): Promise<boolean> {
        if (!CorePlatform.isMobile()) {
            return true;
        }

        return LocalNotifications.hasPermission();
    }

    /**
     * Check whether the app can schedule exact alarms.
     *
     * @returns Whether can schedule exact alarms.
     */
    async canScheduleExactAlarms(): Promise<boolean> {
        if (!CorePlatform.isAndroid()) {
            return true;
        }

        const plugin = this.getCordovaPlugin();
        if (!plugin || !plugin.canScheduleExactAlarms) {
            // Cannot check, assume it's enabled.
            return true;
        }

        return new Promise(resolve => {
            plugin.canScheduleExactAlarms(canSchedule => resolve(canSchedule));
        });
    }

    /**
     * Cancel a local notification.
     *
     * @param id Notification id.
     * @param component Component of the notification.
     * @param siteId Site ID.
     * @returns Promise resolved when the notification is cancelled.
     */
    async cancel(id: number, component: string, siteId: string): Promise<void> {
        const uniqueId = await this.getUniqueNotificationId(id, component, siteId);

        const queueId = `cancel-${uniqueId}`;

        await this.queueRunner.run(queueId, () => LocalNotifications.cancel(uniqueId), {
            allowRepeated: true,
        });
    }

    /**
     * Cancel all the scheduled notifications belonging to a certain site.
     *
     * @param siteId Site ID.
     * @returns Promise resolved when the notifications are cancelled.
     */
    async cancelSiteNotifications(siteId: string): Promise<void> {
        if (!siteId) {
            throw new Error('No site ID supplied.');
        }

        const scheduled = await this.getAllScheduled();

        const ids: number[] = [];
        const queueId = `cancelSiteNotifications-${siteId}`;

        scheduled.forEach((notif) => {
            notif.data = this.parseNotificationData(notif.data);

            if (notif.id && typeof notif.data === 'object' && notif.data.siteId === siteId) {
                ids.push(notif.id);
            }
        });

        await this.queueRunner.run(queueId, () => LocalNotifications.cancel(ids), {
            allowRepeated: true,
        });
    }

    /**
     * Check whether sound can be disabled for notifications.
     *
     * @returns Whether sound can be disabled for notifications.
     */
    canDisableSound(): boolean {
        // Only allow disabling sound in Android 7 or lower. In iOS and Android 8+ it can easily be done with system settings.
        return CorePlatform.isAndroid() && CorePlatform.getPlatformMajorVersion() < 8;
    }

    /**
     * Create the default channel. It is used to change the name.
     *
     * @returns Promise resolved when done.
     */
    protected async createDefaultChannel(): Promise<void> {
        if (!CorePlatform.isAndroid()) {
            return;
        }

        await Push.createChannel({
            id: 'default-channel-id',
            description: Translate.instant('addon.calendar.calendarreminders'),
            importance: 4,
        }).catch((error) => {
            this.logger.error('Error changing channel name', error);
        });
    }

    /**
     * Get all scheduled notifications.
     *
     * @returns Promise resolved with the notifications.
     */
    protected getAllScheduled(): Promise<ILocalNotification[]> {
        return this.queueRunner.run('allScheduled', () => new Promise((resolve) => {
            // LocalNotifications.getAllScheduled is broken, use the Cordova plugin directly.
            const plugin = this.getCordovaPlugin();

            plugin ? plugin.getScheduled(notifications => resolve(notifications)) : resolve([]);
        }));
    }

    /**
     * Get a code to create unique notifications. If there's no code assigned, create a new one.
     *
     * @param table Table to search in local DB.
     * @param id ID of the element to get its code.
     * @returns Promise resolved when the code is retrieved.
     */
    protected async getCode(
        table: AsyncInstance<CoreDatabaseTable<{ id: string; code: number }>>,
        id: string,
    ): Promise<number> {
        const key = `${table}#${id}`;

        // Check if the code is already in memory.
        if (this.codes[key] !== undefined) {
            return this.codes[key];
        }

        try {
            // Check if we already have a code stored for that ID.
            const entry = await table.getOneByPrimaryKey({ id: id });

            this.codes[key] = entry.code;

            return entry.code;
        } catch {
            // No code stored for that ID. Create a new code for it.
            const entries = await table.getMany(undefined, {
                sorting: [
                    { code: 'desc' },
                ],
            });

            let newCode = 0;
            if (entries.length > 0) {
                newCode = entries[0].code + 1;
            }

            await table.insert({ id: id, code: newCode });
            this.codes[key] = newCode;

            return newCode;
        }
    }

    /**
     * Get a notification component code to be used.
     * If it's the first time this component is used to send notifications, create a new code for it.
     *
     * @param component Component name.
     * @returns Promise resolved when the component code is retrieved.
     */
    protected getComponentCode(component: string): Promise<number> {
        return this.requestCode(COMPONENTS_TABLE_NAME, component);
    }

    /**
     * Get a site code to be used.
     * If it's the first time this site is used to send notifications, create a new code for it.
     *
     * @param siteId Site ID.
     * @returns Promise resolved when the site code is retrieved.
     */
    protected getSiteCode(siteId: string): Promise<number> {
        return this.requestCode(LOCAL_NOTIFICATIONS_SITES_TABLE_NAME, siteId);
    }

    /**
     * Create a unique notification ID, trying to prevent collisions. Generated ID must be a Number (Android).
     * The generated ID shouldn't be higher than 2147483647 or it's going to cause problems in Android.
     * This function will prevent collisions and keep the number under Android limit if:
     *     - User has used less than 21 sites.
     *     - There are less than 11 components.
     *     - The notificationId passed as parameter is lower than 10000000.
     *
     * @param notificationId Notification ID.
     * @param component Component triggering the notification.
     * @param siteId Site ID.
     * @returns Promise resolved when the notification ID is generated.
     */
    protected async getUniqueNotificationId(notificationId: number, component: string, siteId: string): Promise<number> {
        if (!siteId || !component) {
            return Promise.reject(new CoreError('Site ID or component not supplied.'));
        }

        const siteCode = await this.getSiteCode(siteId);
        const componentCode = await this.getComponentCode(component);

        // We use the % operation to keep the number under Android's limit.
        return (siteCode * 100000000 + componentCode * 10000000 + notificationId) % 2147483647;
    }

    /**
     * Handle an event triggered by the local notifications plugin.
     *
     * @param eventName Name of the event.
     * @param notification Notification.
     */
    protected handleEvent(eventName: string, notification: ILocalNotification): void {
        if (notification && notification.data) {
            this.logger.debug(`Notification event: ${eventName}. Data:`, notification.data);

            this.notifyEvent(eventName, notification.data);
        }
    }

    /**
     * Returns whether local notifications plugin is available.
     *
     * @returns Whether local notifications plugin is available.
     */
    isPluginAvailable(): boolean {
        return !!this.getCordovaPlugin() && CorePlatform.isMobile();
    }

    /**
     * Get the Cordova plugin object.
     *
     * @returns Cordova plugin, undefined if not found.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected getCordovaPlugin(): any | undefined {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (<any> window).cordova?.plugins?.notification?.local;
    }

    /**
     * Check if a notification has been triggered with the same trigger time.
     *
     * @param notification Notification to check.
     * @param useQueue Whether to add the call to the queue.
     * @returns Promise resolved with a boolean indicating if promise is triggered (true) or not.
     */
    async isTriggered(notification: ILocalNotification, useQueue: boolean = true): Promise<boolean> {
        if (notification.id === undefined) {
            return false;
        }

        try {
            const stored = await this.triggeredTable.getOneByPrimaryKey({ id: notification.id });

            let triggered = (notification.trigger && notification.trigger.at) || 0;

            if (typeof triggered != 'number') {
                triggered = triggered.getTime();
            }

            return stored.at === triggered;
        } catch {
            const notificationId = notification.id || 0;
            if (useQueue) {
                const queueId = `isTriggered-${notificationId}`;

                return this.queueRunner.run(queueId, () => LocalNotifications.isTriggered(notificationId), {
                    allowRepeated: true,
                });
            } else {
                return LocalNotifications.isTriggered(notificationId);
            }
        }
    }

    /**
     * Notify notification click to observers. Only the observers with the same component as the notification will be notified.
     *
     * @param data Data received by the notification.
     */
    notifyClick(data: Record<string, unknown>): void {
        this.notifyEvent('click', data);
    }

    /**
     * Notify a certain event to observers. Only the observers with the same component as the notification will be notified.
     *
     * @param eventName Name of the event to notify.
     * @param data Data received by the notification.
     */
    notifyEvent(eventName: string, data: Record<string, unknown>): void {
        // Execute the code in the Angular zone, so change detection doesn't stop working.
        NgZone.run(() => {
            const component = <string> data.component;
            if (component) {
                if (this.observables[eventName] && this.observables[eventName][component]) {
                    this.observables[eventName][component].next(data);
                }
            }
        });
    }

    /**
     * Parse some notification data.
     *
     * @param data Notification data.
     * @returns Parsed data.
     */
    protected parseNotificationData(data: unknown): unknown {
        if (!data) {
            return {};
        } else if (typeof data == 'string') {
            return CoreText.parseJSON(data, {});
        } else {
            return data;
        }
    }

    /**
     * Process the next request in queue.
     */
    protected async processNextRequest(): Promise<void> {
        const nextKey = Object.keys(this.codeRequestsQueue)[0];

        if (nextKey === undefined) {
            // No more requests in queue, stop.
            return;
        }

        const request = this.codeRequestsQueue[nextKey];

        try {
            // Check if request is valid.
            if (typeof request !== 'object' || request.table === undefined || request.id === undefined) {
                return;
            }

            // Get the code and resolve/reject all the promises of this request.
            const getCodeFromTable = async () => {
                switch (request.table) {
                    case LOCAL_NOTIFICATIONS_SITES_TABLE_NAME:
                        return this.getCode(this.sitesTable, request.id);
                    case COMPONENTS_TABLE_NAME:
                        return this.getCode(this.componentsTable, request.id);
                    default:
                        throw new Error(`Unknown local-notifications table: ${request.table}`);
                }
            };

            const code = await getCodeFromTable();

            request.deferreds.forEach((p) => {
                p.resolve(code);
            });
        } catch (error) {
            request.deferreds.forEach((p) => {
                p.reject(error);
            });
        } finally {
            // Once this item is treated, remove it and process next.
            delete this.codeRequestsQueue[nextKey];
            this.processNextRequest();
        }
    }

    /**
     * Register an observer to be notified when a notification belonging to a certain component is clicked.
     *
     * @param component Component to listen notifications for.
     * @param callback Function to call with the data received by the notification.
     * @returns Object with an "off" property to stop listening for clicks.
     */
    registerClick<T = unknown>(component: string, callback: CoreLocalNotificationsClickCallback<T>): CoreEventObserver {
        return this.registerObserver<T>('click', component, callback);
    }

    /**
     * Register an observer to be notified when a certain event is fired for a notification belonging to a certain component.
     *
     * @param eventName Name of the event to listen to.
     * @param component Component to listen notifications for.
     * @param callback Function to call with the data received by the notification.
     * @returns Object with an "off" property to stop listening for events.
     */
    registerObserver<T = unknown>(
        eventName: string,
        component: string,
        callback: CoreLocalNotificationsClickCallback<T>,
    ): CoreEventObserver {
        this.logger.debug(`Register observer '${component}' for event '${eventName}'.`);

        if (this.observables[eventName] === undefined) {
            this.observables[eventName] = {};
        }

        if (this.observables[eventName][component] === undefined) {
            // No observable for this component, create a new one.
            this.observables[eventName][component] = new Subject<T>();
        }

        this.observables[eventName][component].subscribe(callback);

        return {
            off: (): void => {
                this.observables[eventName][component].unsubscribe();
            },
        };
    }

    /**
     * Remove a notification from triggered store.
     *
     * @param id Notification ID.
     * @returns Promise resolved when it is removed.
     */
    async removeTriggered(id: number): Promise<void> {
        await this.triggeredTable.deleteByPrimaryKey({ id });
    }

    /**
     * Request a unique code. The request will be added to the queue and the queue is going to be started if it's paused.
     *
     * @param table Table to search in local DB.
     * @param id ID of the element to get its code.
     * @returns Promise resolved when the code is retrieved.
     */
    protected requestCode(
        table: typeof LOCAL_NOTIFICATIONS_SITES_TABLE_NAME | typeof COMPONENTS_TABLE_NAME,
        id: string,
    ): Promise<number> {
        const deferred = new CorePromisedValue<number>();
        const key = `${table}#${id}`;
        const isQueueEmpty = Object.keys(this.codeRequestsQueue).length == 0;

        if (this.codeRequestsQueue[key] !== undefined) {
            // There's already a pending request for this store and ID, add the promise to it.
            this.codeRequestsQueue[key].deferreds.push(deferred);
        } else {
            // Add a pending request to the queue.
            this.codeRequestsQueue[key] = {
                table,
                id,
                deferreds: [deferred],
            };
        }

        if (isQueueEmpty) {
            this.processNextRequest();
        }

        return deferred;
    }

    /**
     * Reschedule all notifications that are already scheduled.
     *
     * @returns Promise resolved when all notifications have been rescheduled.
     */
    async rescheduleAll(): Promise<void> {
        // Get all the scheduled notifications.
        const notifications = await this.getAllScheduled();

        await Promise.all(notifications.map(async (notification) => {
            // Convert some properties to the needed types.
            notification.data = this.parseNotificationData(notification.data);

            const queueId = `schedule-${notification.id}`;

            await this.queueRunner.run(queueId, () => this.scheduleNotification(notification), {
                allowRepeated: true,
            });
        }));
    }

    /**
     * Schedule a local notification.
     *
     * @param notification Notification to schedule. Its ID should be lower than 10000000 and it should
     *                     be unique inside its component and site.
     * @param component Component triggering the notification. It is used to generate unique IDs.
     * @param siteId Site ID.
     * @param alreadyUnique Whether the ID is already unique.
     * @returns Promise resolved when the notification is scheduled.
     */
    async schedule(notification: ILocalNotification, component: string, siteId: string, alreadyUnique?: boolean): Promise<void> {
        if (!alreadyUnique) {
            notification.id = await this.getUniqueNotificationId(notification.id || 0, component, siteId);
        }

        notification.data = notification.data || {};
        notification.data.component = component;
        notification.data.siteId = siteId;

        if (CorePlatform.isAndroid()) {
            notification.icon = notification.icon || 'res://icon';
            notification.smallIcon = notification.smallIcon || 'res://smallicon';
            notification.color = notification.color || CoreConstants.CONFIG.notificoncolor;

            if (notification.led !== false) {
                let ledColor = 'FF9900';
                let ledOn = 1000;
                let ledOff = 1000;

                if (typeof notification.led === 'string') {
                    ledColor = notification.led;
                } else if (Array.isArray(notification.led)) {
                    ledColor = notification.led[0] || ledColor;
                    ledOn = notification.led[1] || ledOn;
                    ledOff = notification.led[2] || ledOff;
                } else if (typeof notification.led === 'object') {
                    ledColor = notification.led.color || ledColor;
                    ledOn = notification.led.on || ledOn;
                    ledOff = notification.led.off || ledOff;
                }

                notification.led = {
                    color: ledColor,
                    on: ledOn,
                    off: ledOff,
                };
            }
        }

        const queueId = `schedule-${notification.id}`;

        await this.queueRunner.run(queueId, () => this.scheduleNotification(notification), {
            allowRepeated: true,
        });
    }

    /**
     * Helper function to schedule a notification object if it hasn't been triggered already.
     *
     * @param notification Notification to schedule.
     * @returns Promise resolved when scheduled.
     */
    protected async scheduleNotification(notification: ILocalNotification): Promise<void> {
        // Check if the notification has been triggered already.
        const triggered = await this.isTriggered(notification, false);

        // Cancel the current notification in case it gets scheduled twice.
        LocalNotifications.cancel(notification.id).finally(async () => {
            if (!triggered) {
                let soundEnabled: boolean;

                // Check if sound is enabled for notifications.
                if (!this.canDisableSound()) {
                    soundEnabled = true;
                } else {
                    soundEnabled = await CoreConfig.get(CoreConstants.SETTINGS_NOTIFICATION_SOUND, true);
                }

                if (!soundEnabled) {
                    notification.sound = undefined;
                } else {
                    delete notification.sound; // Use default value.
                }

                notification.foreground = true;

                // Remove from triggered, since the notification could be in there with a different time.
                this.removeTriggered(notification.id || 0);
                LocalNotifications.schedule(notification);
            }
        });
    }

    /**
     * Function to call when a notification is triggered. Stores the notification so it's not scheduled again unless the
     * time is changed.
     *
     * @param notification Triggered notification.
     * @returns Promise resolved when stored, rejected otherwise.
     */
    async trigger(notification: ILocalNotification): Promise<number> {
        let time = Date.now();
        if (notification.trigger?.at) {
            // The type says "at" is a Date, but in Android we can receive timestamps instead.
            if (typeof notification.trigger.at === 'number') {
                time = <number> notification.trigger.at;
            } else {
                time = notification.trigger.at.getTime();
            }
        }

        return this.triggeredTable.insert({
            id: notification.id,
            at: time,
        });
    }

    /**
     * Update a component name.
     *
     * @param oldName The old name.
     * @param newName The new name.
     * @returns Promise resolved when done.
     */
    async updateComponentName(oldName: string, newName: string): Promise<void> {
        const oldId = `${COMPONENTS_TABLE_NAME}#${oldName}`;
        const newId = `${COMPONENTS_TABLE_NAME}#${newName}`;

        await this.componentsTable.update({ id: newId }, { id: oldId });
    }

    /**
     * Open notification settings.
     */
    openNotificationSettings(): void {
        if (!CorePlatform.isMobile()) {
            return;
        }

        this.getCordovaPlugin()?.openNotificationSettings();
    }

    /**
     * Open alarm settings (Android only).
     */
    openAlarmSettings(): void {
        if (!CorePlatform.isAndroid()) {
            return;
        }

        this.getCordovaPlugin()?.openAlarmSettings();
    }

}

export const CoreLocalNotifications = makeSingleton(CoreLocalNotificationsProvider);

export type CoreLocalNotificationsClickCallback<T = unknown> = (value: T) => void;
