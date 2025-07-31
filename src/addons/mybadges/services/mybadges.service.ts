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
import { inject, Injectable } from '@angular/core';
import { CoreSite } from '@classes/sites/site';
import { CoreSites } from '@services/sites';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
    ChallengesResponse,
    RankingCategoriesResponse,
    RankingUsersResponse,
    UserChallengesGroupedByCategory,
    UserChallengesResponse,
} from '../types/types';

@Injectable({
    providedIn: 'root',
})
export class MyBadgesService {
    private userId: number | undefined;
    site: CoreSite;
    private http: HttpClient = inject(HttpClient);
    achievements: UserChallengesResponse | undefined;
    challenges: ChallengesResponse | undefined;
    rankingUsers: RankingUsersResponse | undefined;
    rankingCategories: RankingCategoriesResponse | undefined;
    constructor() {
        this.site = CoreSites.getRequiredCurrentSite();
        this.userId = this.site.getUserId();
    }

    getUserId(): number | undefined {
        return this.userId;
    }

    async getUserAchievements(): Promise<UserChallengesResponse> {
        const url = `${this.site.getURL()}/local/mascop_plugin/api/achievements.php?userid=${
            this.userId
        }`;

        this.achievements = await firstValueFrom(
            this.http.get<UserChallengesResponse>(url)
        );

        return this.achievements;
    }

    async getAllChallenges(): Promise<ChallengesResponse> {
        const url = `${this.site.getURL()}/local/mascop_plugin/api/all_challenges.php`;

        this.challenges = await firstValueFrom(
            this.http.get<ChallengesResponse>(url)
        );

        return this.challenges;
    }

    async getAchievementsGroupedByCategory(): Promise<UserChallengesGroupedByCategory> {
        const achievements = await this.getUserAchievements();
        const challenges = await this.getAllChallenges();

        const categories = Array.from(
            new Set(challenges.retos.map((ch) => ch.category))
        );

        const grouped = categories.map((category) => {
            const retosEnCategoria = challenges.retos.filter(
                (ch) => ch.category === category
            );
            const items = retosEnCategoria.map((challenge) => {
                const logro = achievements.medallas.find(
                    (m) => m.challenge.id === challenge.id
                );

                return {
                    challenge,
                    achieved: !!logro,
                    achievementId: logro?.id,
                };
            });

            return {
                category,
                items,
            };
        });

        return grouped;
    }

    async getRankingUser(
        categoryid = '',
        courseid = '',
        startdate = '',
        enddate = ''
    ): Promise<RankingUsersResponse> {
        const url = `${this.site.getURL()}/local/mascop_plugin/api/ranking_user.php`;

        this.rankingUsers = await firstValueFrom(
            this.http.get<RankingUsersResponse>(url, {
                params: {
                    categoryid,
                    courseid,
                    startdate,
                    enddate,
                },
            })
        );

        return this.rankingUsers;
    }

    async getRankingCategories(
        categoryid = '',
        startdate = '',
        courseid = '',
        enddate = ''
    ): Promise<RankingCategoriesResponse> {
        const url = `${this.site.getURL()}/local/mascop_plugin/api/ranking_categories.php`;

        this.rankingCategories = await firstValueFrom(
            this.http.get<RankingCategoriesResponse>(url, {
                params: {
                    courseid,
                    categoryid,
                    startdate,
                    enddate,
                },
            })
        );

        return this.rankingCategories;
    }
}
