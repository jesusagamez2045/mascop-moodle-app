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

import { Component } from '@angular/core';
import { AddonModWorkshopAssessmentStrategyBaseComponent } from '../../../classes/assessment-strategy-component';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Component for rubric assessment strategy.
 */
@Component({
    selector: 'addon-mod-workshop-assessment-strategy-rubric',
    templateUrl: 'addon-mod-workshop-assessment-strategy-rubric.html',
    imports: [
        CoreSharedModule,
    ],
})
export class AddonModWorkshopAssessmentStrategyRubricComponent extends AddonModWorkshopAssessmentStrategyBaseComponent { }
