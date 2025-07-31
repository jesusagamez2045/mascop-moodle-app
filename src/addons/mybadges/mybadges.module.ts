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
import { NgModule, provideAppInitializer } from '@angular/core';
import { Routes } from '@angular/router';
import { CoreMainMenuRoutingModule } from '@features/mainmenu/mainmenu-routing.module';
import { CoreMainMenuTabRoutingModule } from '@features/mainmenu/mainmenu-tab-routing.module';

import { CoreMainMenuDelegate } from '@features/mainmenu/services/mainmenu-delegate';
import { AddonMyBadgesMainMenuHandler } from './services/handlers/mainmenu';
import { ADDON_MYBADGES_PAGE_NAME } from './constants';

const mainMenuChildrenRoutes: Routes = [
    {
        path: ADDON_MYBADGES_PAGE_NAME,
        loadChildren: () => import('./mybadges-lazy.module'),
    },
];

@NgModule({
    imports: [
        CoreMainMenuTabRoutingModule.forChild(mainMenuChildrenRoutes),
        CoreMainMenuRoutingModule.forChild({ children: mainMenuChildrenRoutes }),
    ],
    providers: [
        provideAppInitializer(async () => {
            CoreMainMenuDelegate.registerHandler(AddonMyBadgesMainMenuHandler.instance);
        }),
    ],
})
export class AddonMyBadgesModule {}
