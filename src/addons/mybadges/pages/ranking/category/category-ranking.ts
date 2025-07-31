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
import { CoreSharedModule } from '@/core/shared.module';
import { MyBadgesService } from '@addons/mybadges/services/mybadges.service';
import {
    Category,
    Course,
    RankingCategoriesResponse,
} from '@addons/mybadges/types/types';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import Chart from 'chart.js/auto';

@Component({
    selector: 'page-addon-mybadges-detail',
    templateUrl: 'category-ranking.page.html',
    standalone: true,
    imports: [CommonModule, TranslateModule, CoreSharedModule],
})
export default class AddonCategoryRankingPage implements OnInit {
    myBadgesService = inject(MyBadgesService);
    categoriesRanking: RankingCategoriesResponse | undefined;
    categories: Category[] = [];
    courses: Course[] = [];
    startDate: string | undefined;
    endDate: string | undefined;
    category: string | undefined = '';
    course: string | undefined = '';

    chart: Chart | undefined;

    async ngOnInit(): Promise<void> {
        this.getCategories();
        this.categoriesRanking =
            await this.myBadgesService.getRankingCategories();

        this.createChart();
    }

    async getCategories(): Promise<void> {
        this.categories = await this.myBadgesService.getCategories();
    }

    async getCoursesByCategory(): Promise<void> {
        if (!this.category) {
            this.courses = [];

            return;
        }

        this.courses = await this.myBadgesService.getCoursesByCategory(
            this.category
        );
    }

    async onChangeCategory(): Promise<void> {
        this.course = undefined;
        this.courses = [];
        await this.getCoursesByCategory();
    }

    async filterRanking(): Promise<void> {
        const formattedStartDate = this.startDate
            ? this.startDate.split('T')[0]
            : '';

        const formattedEndDate = this.endDate ? this.endDate.split('T')[0] : '';

        this.categoriesRanking =
            await this.myBadgesService.getRankingCategories(
                this.category || '',
                formattedStartDate,
                this.course || '',
                formattedEndDate
            );

        this.createChart();
    }

    createChart(): void {
        if (this.chart) {
            this.chart.destroy();
        }

        const labels =
            this.categoriesRanking?.ranking.map((user) => user.category_name) ||
            [];
        const data =
            this.categoriesRanking?.ranking.map((user) => user.medallas) || [];

        this.chart = new Chart('rankingChart', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Medallas',
                        data: data,
                        backgroundColor: '#3366CC',
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Podio de Centros Educativos por Medallas',
                        font: {
                            weight: 'bold',
                        },
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Cantidad de Medallas',
                            font: {
                                style: 'italic',
                            },
                        },
                        beginAtZero: true,
                    },
                },
            },
        });
    }
}
