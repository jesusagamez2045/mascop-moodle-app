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
import { Injector, NgModule } from '@angular/core';
import { ROUTES, Routes } from '@angular/router';
import { buildTabMainRoutes } from '@features/mainmenu/mainmenu-tab-routing.module';
import { ADDON_MYBADGES_CATEGORY_RANKING_NAME, ADDON_MYBADGES_PAGE_NAME, ADDON_MYBADGES_USER_RANKING_NAME } from './constants';

// eslint-disable-next-line jsdoc/require-returns
/**
 *
 */
function buildRoutes(injector: Injector): Routes {
    return [
        {
            path: 'index',
            data: { mainMenuTabRoot: ADDON_MYBADGES_PAGE_NAME },
            loadComponent: () => import('@addons/mybadges/pages/index'),
        },
        {
            path: ADDON_MYBADGES_USER_RANKING_NAME,
            loadComponent: () => import('@addons/mybadges/pages/ranking/user/user-ranking'),
        },
        {
            path: ADDON_MYBADGES_CATEGORY_RANKING_NAME,
            loadComponent: () => import('@addons/mybadges/pages/ranking/category/category-ranking'),
        },
        ...buildTabMainRoutes(injector, {
            redirectTo: 'index',
            pathMatch: 'full',
        }),
    ];
}

@NgModule({
    providers: [
        {
            provide: ROUTES,
            multi: true,
            deps: [Injector],
            useFactory: buildRoutes,
        },
    ],
})
export default class AddonMyBadgesLazyModule {}
