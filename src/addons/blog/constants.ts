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

export const ADDON_BLOG_MAINMENU_PAGE_NAME = 'blog';
export const ADDON_BLOG_ENTRY_UPDATED = 'blog_entry_updated';
export const ADDON_BLOG_AUTO_SYNCED = 'addon_blog_autom_synced';
export const ADDON_BLOG_MANUAL_SYNCED = 'addon_blog_manual_synced';
export const ADDON_BLOG_SYNC_ID = 'blog';

/**
 * Restriction level of user blog visualization.
 */
export const enum CoreSiteBlogLevel {
    BLOG_USER_LEVEL = 1,
    BLOG_GROUP_LEVEL = 2,
    BLOG_COURSE_LEVEL = 3,
    BLOG_SITE_LEVEL = 4,
    BLOG_GLOBAL_LEVEL = 5,
}
