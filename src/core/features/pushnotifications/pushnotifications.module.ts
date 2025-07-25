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

import { NgModule, Type, provideAppInitializer } from '@angular/core';

import { CoreCronDelegate } from '@services/cron';
import { CORE_SITE_SCHEMAS } from '@services/sites';
import { SITE_SCHEMA } from './services/database/pushnotifications';
import { CorePushNotificationsRegisterCronHandler } from './services/handlers/register-cron';
import { CorePushNotificationsUnregisterCronHandler } from './services/handlers/unregister-cron';
import { CorePushNotifications } from './services/pushnotifications';

/**
 * Get push notifications services.
 *
 * @returns Returns push notifications services.
 */
export async function getPushNotificationsServices(): Promise<Type<unknown>[]> {
    const { CorePushNotificationsProvider } = await import('@features/pushnotifications/services/pushnotifications');
    const { CorePushNotificationsDelegateService } = await import('@features/pushnotifications/services/push-delegate');

    return [
        CorePushNotificationsProvider,
        CorePushNotificationsDelegateService,
    ];
}

@NgModule({
    declarations: [
    ],
    imports: [
    ],
    providers: [
        {
            provide: CORE_SITE_SCHEMAS,
            useValue: [SITE_SCHEMA],
            multi: true,
        },
        provideAppInitializer(async () => {
            // Register the handlers.
            CoreCronDelegate.register(CorePushNotificationsRegisterCronHandler.instance);
            CoreCronDelegate.register(CorePushNotificationsUnregisterCronHandler.instance);

            await CorePushNotifications.initialize();
        }),
    ],
})
export class CorePushNotificationsModule {}
