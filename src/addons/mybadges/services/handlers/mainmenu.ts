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
import { CoreMainMenuHandler, CoreMainMenuHandlerData } from '@features/mainmenu/services/mainmenu-delegate';
import { ADDON_MYBADGES_PAGE_NAME } from '../../constants';
import { makeSingleton } from '@singletons';

@Injectable({ providedIn: 'root' })
export class AddonMyBadgesMainMenuHandlerService implements CoreMainMenuHandler {

    name = 'AddonMyBadges';
    priority = 600;

    async isEnabled(): Promise<boolean> {
        return true;
    }

    getDisplayData(): CoreMainMenuHandlerData {
         return {
            icon: 'fas-award',
            title: 'addon.mybadges.mybadges',
            page: ADDON_MYBADGES_PAGE_NAME,
            class: 'addon-mybadges-handler',
        };
    }

}

export const AddonMyBadgesMainMenuHandler = makeSingleton(AddonMyBadgesMainMenuHandlerService);
