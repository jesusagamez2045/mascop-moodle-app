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
/* eslint-disable @typescript-eslint/naming-convention */

export type Achievements = {
    userid: number;
    medallas: Medalla[];
};

export type Medalla = {
    id: string;
    challenge: UserChallenge;
};
export type UserChallenge = {
    id: string;
    nombre: string;
    categoria: string;
    descripcion: string;
    imagen: string;
};
export type Challenge = {
    id: string;
    name: string;
    category: string;
    description: string;
    criteria_type: string;
    criteria_data: string;
    badgeid: string | null;
    image: string;
    enabled: string;
};

export type ChallengesResponse = {
    retos: Challenge[];
};
export type UserChallengesResponse = {
    userid: number;
    medallas: Medalla[];
};
export type UserChallengesGroupedByCategory = {
    category: string;
    items: {
        challenge: Challenge;
        achieved: boolean;
        achievementId?: string;
    }[];
}[];

export type RankingUser = {
    userid: string;
    nombre: string;
    medallas: number;
};

export type RankingUsersResponse = {
    ranking: RankingUser[];
};

export type RankingCategory = {
    category_id: string;
    category_name: string;
    medallas: number;
};

export type RankingCategoriesResponse = {
    ranking: RankingCategory[];
};
