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

import {
    AddonCourseCompletion,
    AddonCourseCompletionCourseCompletionStatus,
} from '@addons/coursecompletion/services/coursecompletion';
import { Component, OnInit } from '@angular/core';
import { CoreUser, CoreUserProfile } from '@features/user/services/user';
import { CoreAnalytics, CoreAnalyticsEventType } from '@services/analytics';
import { CoreLoadings } from '@services/overlays/loadings';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { Translate } from '@singletons';
import { CoreTime } from '@singletons/time';
import { CoreAlerts } from '@services/overlays/alerts';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Page that displays the course completion report.
 */
@Component({
    selector: 'page-addon-course-completion-report',
    templateUrl: 'report.html',
    imports: [
        CoreSharedModule,
    ],
})
export default class AddonCourseCompletionReportPage implements OnInit {

    protected userId!: number;
    protected logView: () => void;

    courseId!: number;
    completionLoaded = false;
    completion?: AddonCourseCompletionCourseCompletionStatus;
    showSelfComplete = false;
    tracked = true; // Whether completion is tracked.
    statusText?: string;
    user?: CoreUserProfile;

    constructor() {
        this.logView = CoreTime.once(() => {
            CoreAnalytics.logEvent({
                type: CoreAnalyticsEventType.VIEW_ITEM,
                ws: 'core_completion_get_course_completion_status',
                name: Translate.instant('addon.coursecompletion.coursecompletion'),
                data: {
                    course: this.courseId,
                    user: this.userId,
                },
                url: `/blocks/completionstatus/details.php?course=${this.courseId}&user=${this.userId}`,
            });
        });
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        try {
            this.courseId = CoreNavigator.getRequiredRouteNumberParam('courseId');
            this.userId = CoreNavigator.getRouteNumberParam('userId') || CoreSites.getCurrentSiteUserId();
        } catch (error) {
            CoreAlerts.showError(error);
            CoreNavigator.back();

            return;
        }

        this.fetchCompletion().finally(() => {
            this.completionLoaded = true;
        });
    }

    /**
     * Fetch compleiton data.
     */
    protected async fetchCompletion(): Promise<void> {
        try {
            this.user = await CoreUser.getProfile(this.userId, this.courseId, true);

            this.completion = await AddonCourseCompletion.getCompletion(this.courseId, this.userId);

            this.statusText = AddonCourseCompletion.getCompletedStatusText(this.completion);
            this.showSelfComplete = AddonCourseCompletion.canMarkSelfCompleted(this.userId, this.completion);

            this.tracked = true;
            this.logView();
        } catch (error) {
            if (error && error.errorcode == 'notenroled') {
                // Not enrolled error, probably a teacher.
                this.tracked = false;
            } else {
                CoreAlerts.showError(error, { default: Translate.instant('addon.coursecompletion.couldnotloadreport') });
            }
        }
    }

    /**
     * Refresh completion data on PTR.
     *
     * @param refresher Refresher instance.
     */
    async refreshCompletion(refresher?: HTMLIonRefresherElement): Promise<void> {
        await AddonCourseCompletion.invalidateCourseCompletion(this.courseId, this.userId).finally(() => {
            this.fetchCompletion().finally(() => {
                refresher?.complete();
            });
        });
    }

    /**
     * Mark course as completed.
     */
    async completeCourse(): Promise<void> {
        try {
            await CoreAlerts.confirm(Translate.instant('addon.coursecompletion.confirmselfcompletion'), {
                okText: Translate.instant('core.yes'),
                cancelText: Translate.instant('core.no'),
            });

            const modal = await CoreLoadings.show('core.sending', true);

            try {
                await AddonCourseCompletion.markCourseAsSelfCompleted(this.courseId);

                await this.refreshCompletion();
            } catch (error) {
                CoreAlerts.showError(error);
            } finally {
                modal.dismiss();
            }
        } catch {
            // User cancelled.
        }
    }

}
