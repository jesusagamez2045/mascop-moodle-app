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

import { AddonModQuizTextQuestion, CoreQuestionBaseComponent } from '@features/question/classes/base-question-component';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Component to render a short answer question.
 */
@Component({
    selector: 'addon-qtype-shortanswer',
    templateUrl: 'addon-qtype-shortanswer.html',
    styleUrl: 'shortanswer.scss',
    imports: [
        CoreSharedModule,
    ],
})
export class AddonQtypeShortAnswerComponent extends CoreQuestionBaseComponent<AddonModQuizTextQuestion> {

    /**
     * @inheritdoc
     */
    init(): void {
        this.initInputTextComponent();
        this.onReadyPromise.resolve();
    }

}
