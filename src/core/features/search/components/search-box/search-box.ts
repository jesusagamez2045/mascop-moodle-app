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

import { Component, Input, Output, EventEmitter, OnInit, signal, ViewChild, ElementRef } from '@angular/core';

import { CoreSites } from '@services/sites';
import { CoreSearchHistory } from '../../services/search-history.service';
import { Translate } from '@singletons';
import { CoreSearchHistoryDBRecord } from '../../services/search-history-db';
import { CoreForms } from '@singletons/form';
import { toBoolean } from '@/core/transforms/boolean';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Component to display a "search box".
 *
 * @description
 * This component will display a standalone search box with its search button in order to have a better UX.
 *
 * Example usage:
 * <core-search-box (onSubmit)="search($event)" [placeholder]="'core.courses.search' | translate"
 *     [searchLabel]="'core.courses.search' | translate" autoFocus="true"></core-search-box>
 */
@Component({
    selector: 'core-search-box',
    templateUrl: 'core-search-box.html',
    styleUrl: 'search-box.scss',
    imports: [
        CoreSharedModule,
    ],
})
export class CoreSearchBoxComponent implements OnInit {

    @Input() searchLabel?: string; // Label to be used on action button.
    @Input() placeholder?: string; // Placeholder text for search text input.
    @Input() autocorrect = 'on'; // Enables/disable Autocorrection on search text input.
    @Input({ transform: toBoolean }) spellcheck = true; // Enables/disable Spellchecker on search text input.
    @Input({ transform: toBoolean }) autoFocus = false; // Enables/disable Autofocus when entering view.
    @Input() lengthCheck = 3; // Check value length before submit. If 0, any string will be submitted.
    @Input({ transform: toBoolean }) showClear = true; // Show/hide clear button.
    @Input({ transform: toBoolean }) disabled = false; // Disables the input text.
    @Input() initialSearch = ''; // Initial search text.

    /* If provided. It will save and display a history of searches for this particular Id.
     * To use different history lists, place different Id.
     * I.e. AddonMessagesContacts or CoreUserParticipants-6 (using the course Id).*/
    @Input() searchArea = '';

    @Output() onSubmit: EventEmitter<string>; // Send data when submitting the search form.
    @Output() onClear: EventEmitter<void>; // Send event when clearing the search form.

    @ViewChild('searchForm') formElement?: ElementRef;
    searched = ''; // Last search emitted.
    searchText = '';
    history: CoreSearchHistoryDBRecord[] = [];
    readonly historyShown = signal(false);
    readonly showLengthAlert = signal(false);

    constructor() {
        this.onSubmit = new EventEmitter<string>();
        this.onClear = new EventEmitter<void>();
    }

    ngOnInit(): void {
        this.searchLabel = this.searchLabel || Translate.instant('core.search');
        this.placeholder = this.placeholder || Translate.instant('core.search');
        this.searchText = this.initialSearch;

        if (this.searchArea) {
            this.loadHistory();
        }
    }

    /**
     * Form submitted.
     *
     * @param e Event.
     */
    submitForm(e?: Event): void {
        e?.preventDefault();
        e?.stopPropagation();

        if (this.searchText.length < this.lengthCheck) {
            this.showLengthAlert.set(true);

            return;
        }

        this.showLengthAlert.set(false);

        if (this.searchArea) {
            this.saveSearchToHistory(this.searchText);
        }

        CoreForms.triggerFormSubmittedEvent(this.formElement, false, CoreSites.getCurrentSiteId());

        this.historyShown.set(false);
        this.searched = this.searchText;
        this.onSubmit.emit(this.searchText);
    }

    /**
     * Saves the search term onto the history.
     *
     * @param text Text to save.
     * @returns Promise resolved when done.
     */
    protected async saveSearchToHistory(text: string): Promise<void> {
        try {
            await CoreSearchHistory.insertOrUpdateSearchText(this.searchArea, text.toLowerCase());
        } finally {
            this.loadHistory();
        }
    }

    /**
     * Loads search history.
     *
     * @returns Promise resolved when done.
     */
    protected async loadHistory(): Promise<void> {
        this.history = await CoreSearchHistory.getSearchHistory(this.searchArea);
    }

    /**
     * Select an item and use it for search text.
     *
     * @param e Event.
     * @param text Selected text.
     */
    historyClicked(e: Event, text: string): void {
        if (this.searched != text) {
            this.searchText = text;
            this.submitForm(e);
        }
    }

    /**
     * Form submitted.
     */
    clearForm(): void {
        this.searched = '';
        this.searchText = '';
        this.showLengthAlert.set(false);
        this.onClear.emit();
    }

    /**
     * Search input focused.
     */
    focus(): void {
        this.historyShown.set(true);
    }

    /**
     * Checks if the search box has lost focus.
     */
    checkFocus(): void {
        // Wait until the new element is focused.
        setTimeout(() => {
            if (document.activeElement?.closest('form') !== this.formElement?.nativeElement) {
                this.historyShown.set(false);
                this.showLengthAlert.set(false);
            }
        });
    }

}
