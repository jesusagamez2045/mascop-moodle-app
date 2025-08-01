This file describes API changes in the Moodle App that affect site plugins, information provided here is intended especially for developers.

For more information about upgrading, read the official documentation: https://moodledev.io/general/app/upgrading/

5.1.0
=====

 - "model" has been removed for site plugins because it isn't needed and it's not compatible with Angular 18. "model" is meant to support 2-way data binding in custom components, and site plugins cannot create components.
- The (onChange) output in core-combobox has been deprecated, please use (selectionChange) instead.

5.0.0
=====

 - The logout process has been refactored, now it uses a logout page to trigger Angular guards. CoreSites.logout now uses this process, and CoreSites.logoutForRedirect is deprecated and shouldn't be used anymore.
 - The parameters of treatDownloadedFile of plugin file handlers have changed. Now the third parameter is an object with all the optional parameters.
 - Some CoreColors functions have been refactored to handle alpha and to validate colors.
 - The parameters of CoreUrl.addParamsToUrl have changed. Now the third parameter is an object with all the optional parameters.
 - The following CoreLang functions were converted to async to properly handle child languages: addSitePluginsStrings, loadCustomStringsFromSite, loadCustomStrings, loadLangStrings, loadString.
 - Assignment and Workshop components will only be available for siteplugins related to the same activity.
 - Some components won't be available anymore for plugins because it didn't make much sense to have them available. For example: quiz components, core-course-course-index-tour, core-course-tag-area, etc.
 - On assignment activity Feedback plugins, the form controls are now shown in the same page and draft managing functions have been deprecated.
 - On prepareFeedbackData handler function for assignment activity Feedback plugins, a new parameter inputData has been added.
 - moment and moment-timezone have been removed in favour of dayjs.
 - moment has been deprecated to be used in site plugins, use native Date parsing functions instead. Now it uses dayjs when calling moment instance.
 - Location permissions have been removed from the app. Geolocation and CoreGeolocation services are now deprecated and no longer allow obtaining the location.
 - chart.js has been updated to 4.4.8 some breaking changes may occur when using CoreChartComponent.
 - Assign submission plugins now should implement canContainFiltersWhenEditing instead of canEditOffline.
 - On CoreSitesProvider, functions addSiteFromSiteListEntry, makeSiteFromSiteListEntry and getSiteFromDB are now protected and unsetCurrentSite removed.

4.5.0
=====

 - Ionic has been upgraded to major version 8. See breaking changes and upgrade guide here: https://ionicframework.com/docs/updating/8-0
 - core-show-password has been deprecated in favor of ion-input-password-toggle


4.4.0
=====

 - Ionic has been upgraded to major version 7. See breaking changes and upgrade guide here: https://ionicframework.com/docs/updating/7-0 and https://ionicframework.com/docs/updating/6-0
 - Starting with this release, this file will only document breaking changes for APIs exposed to site plugins. Internal changes will no longer be documented.
 - CoreCache has been deprecated, use plain object as in-memory stores instead.
 - Renamed CoreLoginSitesComponent to CoreLoginSitesModalComponent to make it clear that it's a modal and to avoid confusing it with the new CoreSitesListComponent.
 - Removed CoreToLocaleStringPipe deprecated since 3.6.0
 - With the upgrade to Ionic 7 ion-slides is no longer supported and now you need to use swiper-container and swiper-slide. More info here: https://ionicframework.com/docs/angular/slides
 - With the upgrade to Ionic7 ion-datetime has changed its usage. We recommend using ion-datetime-button. More info here: https://ionicframework.com/docs/updating/6-0#datetime
 - CoreLoginHelper.getErrorMessages has been removed. Please create the messages object yourself.
 - CoreAppProvider.isAutomated() has been deprecated, use CorePlatformService.isAutomated() instead.
 - Due to a breaking change in cordova-plugin-file, avoid using FileEntry.toURL(). Use CoreFileProvider.getFileEntryURL instead.
 - FileTransfer service is no longer available, now we recommend use window.FileTransfer instead.
 - CSS variable --font-size-normal has been deprecated in favor of --font-size-md.
 - Activity modules services that do not admit plugins are not available for site plugins anymore.
 - CoreUserDelegate type available values changed from newpage and communication to listitem and button.

4.3.0
=====

 - CoreSiteBasicInfo fullName attribute has changed to fullname and avatar to userpictureurl to match user fields.
 - Font Awesome icon library has been updated to 6.4.0. But nothing has changed, only version number.
 - The analytics system in the app has been refactored and some functions that could trigger analytics calls no longer do it, now you need to use CoreAnalytics instead. Some functions in CoreCourseLogHelper and CorePushNotificationsProvider have been deprecated.
 - Due to the analytics refactor, the parameters of most log functions have changed.
 - CoreCourseModuleHandlerData.buttons has been deprecated, now only one button in attribute button will be shown.

4.2.0
=====

- CoreIconComponent has been removed after deprecation period: Use CoreFaIconDirective instead.
- The courseSummaryComponent property has been removed from the CoreCourseFormatComponent component, and the getCourseSummaryComponent method from the CoreCourseFormatHandler interface.
- Font Awesome icon library has been updated to 6.3.0.
- Some methods in glossary addon services have changed.

4.1.0
=====

- Zoom levels changed from "normal / low / high" to " none / medium / high".
- --addon-messages-* CSS3 variables have been renamed to --core-messages-*
- The database constants in CoreSite (WS_CACHE_TABLE, CONFIG_TABLE, LAST_VIEWED_TABLE) and the DBRecord types have been moved to src/core/services/database.
- The component <core-block> will no longer detect changes of properties inside the extraData object, it will only detect changes if the object itself changes.
- CSS variable declarations have been moved to the `html` selector instead of using `body` and `:root`.
- The second argument of `CoreTextUtilsProvider.cleanTags` has been converted into an object with boolean flags.

4.0.0
=====

- The versioncode in moodle.config.json has changed from 4 digits to 5 digits to match the actual value for the stores: the 4.0.0 version's versioncode is now 40000 instead of 4000. If you maintain a Moodle plugin with mobile support and you use the versioncode that is sent in every request, you might need to check if this change will affect your code.
- The parameters of the functions confirmAndPrefetchCourse and confirmAndPrefetchCourses have changed, they now accept an object with options.
- Component core-navigation-bar changed to add an slider inside. previous, previousTitle, next, nextTitle, info and title have been removed.
  Now you have to pass all items and 3 optional params have been added.
- CoreCourseModulePrefetchDelegate.getPrefetchHandlerFor now admits module name instead of full module object.
- CoreCourse.getModuleBasicInfoByInstance and CoreCourse.getModuleBasicInfo have been modified to accept an "options" parameter instead of only siteId.
- The function CoreFilepool.isFileDownloadingByUrl now returns Promise<boolean> instead of relying on resolve/reject.
- downloadEnabled input has been removed from CoreBlockSideBlocksComponent, CoreCourseFormatComponent, CoreCourseFormatSingleActivityComponent and CoreCourseModuleComponent.
- There were several breaking changes done in CoreUserDelegate and its handlers:
    The function CoreUserDelegate.getProfileHandlersFor must now receive a context + contextId instead of a courseId.
    The user handler function isEnabledForCourse is now called isEnabledForContext and receives a context + contextId instead of a courseId.
    Some user handler's functions have also changed to accept context + contextId instead of a courseId: isEnabledForUser, getDisplayData, action.
- CoreCourseHelperProvider.openCourse parameters changed, now it admits CoreNavigationOptions + siteId on the same object that includes Params passed to page.
- displaySectionSelector has been deprecated on CoreCourseFormatHandler, use displayCourseIndex instead.
- Most of the functions or callbacks that handle redirects/deeplinks have been modified to accept an object instead of just path + options. E.g.: CoreLoginHelper.isSiteLoggedOut, CoreLoginHelper.openBrowserForSSOLogin, CoreLoginHelper.openBrowserForOAuthLogin, CoreLoginHelper.prepareForSSOLogin, CoreApp.storeRedirect, CoreSites.loadSite.
- Course preview page route has changed from course/:courseId/preview to course/:courseId/summary to match with the page name and characteristics.
- The parameters of the following functions in CoreCourseHelper have changed: navigateToModuleByInstance, navigateToModule, openModule.
- fillContextMenu, expandDescription, gotoBlog, prefetch and removeFiles functions have been removed from CoreCourseModuleMainResourceComponent.
- contextMenuPrefetch and fillContextMenu have been removed from CoreCourseHelper.
- The variable "loaded" in CoreCourseModuleMainResourceComponent has been changed to "showLoading" to reflect its purpose better.
- The function getCurrentSection of course formats can now return a forceSelected boolean along with the section (defaults to false if not returned).
- The link handlers functions (CoreContentLinksHandler) will now always receive a relative URL instead of an absolute URL. The CoreContentLinksHandlerBase class now adds "^" to the start of the pattern by default to prevent false positives.
- The function CoreLoginHelper.setWaitingForBrowser has been removed, use CoreLoginHelper.waitForBrowser and CoreLoginHelper.stopWaitingForBrowser instead.


3.9.5
=====

- Several functions inside AddonNotificationsProvider have been modified to accept an "options" parameter instead of having several optional parameters.
- Schemas are now registered using Angular providers with the CORE_SITE_SCHEMAS injection token instead of CoreSitesProvider.registerSiteSchema.

3.9.3
=====

- In the core-attachments component, passing a -1 as maxSize or maxSubmissions used to mean "unknown limit". Now -1 means unlimited. Also, passing a 0 to maxSize used to mean "unknown" too, now 0 means user max size.
- Most functions that call a WebService in addons/mod have been modified to accept an "options" parameter instead of having several optional parameters.

3.8.3
=====

- CoreFileProvider.writeFileDataInFile has been deprecated. Please use CoreFileHelperProvider.writeFileDataInFile instead.

3.8.0
=====

- CoreDomUtilsProvider.extractDownloadableFilesFromHtml and CoreDomUtilsProvider.extractDownloadableFilesFromHtmlAsFakeFileObjects have been deprecated. Please use CoreFilepoolProvider.extractDownloadableFilesFromHtml and CoreFilepoolProvider.extractDownloadableFilesFromHtmlAsFakeFileObjects. We had to move them to prevent a circular dependency.

3.7.1
=====

- CoreGroupsProvider.getActivityAllowedGroups and CoreGroupsProvider.getActivityAllowedGroupsIfEnabled now return the full response of core_group_get_activity_allowed_groups instead of just the groups.

3.7.0
=====

- The pushnotifications addon has been moved to core. All imports of that addon need to be fixed to use the right path and name.
- Now the expirationTime of cache entries contains the time the entry was modified, not the expiration time. This is to allow calculating dynamic expiration times. We decided to reuse the same field to prevent modifying the database table.

3.6.1
=====

- The local notifications plugin was updated to its latest version. The new API has some breaking changes, so please check its documentation if you're using local notifications. Also, you need to run "npm install" to update the ionic-native library.
- New method CoreSitesProvider.registerSiteSchema allows to register table schemas and migration functions for site databases. Prefer this method over CoreSitesProvider.createTablesFromSchema: it supports schema migrations and it tracks the installed version of the schema, so it does not try to create the tables on every app boot.

3.6.0
=====

- gulp was updated to v4. In order for gulp to work, you need to install gulp-cli: npm install -g gulp-cli
  It's also recommended to update ionic cli to v4, otherwise some errors could be raised while building: npm install -g ionic
- The value of the constant CoreCourseProvider.ALL_SECTIONS_ID has changed from -1 to -2.
- Use of completionstatus on the module object has been deprecated, use completiondata instead.
- The function CoreSitesProvider.loadSite has changed, now it will trigger SESSION_EXPIRED event if the site is logged out. Its params and return value have changed.
- When using CoreDomUtils.showAlert, please use alert.didDismiss.subscribe() instead of alert.onDidDismiss().
- The page CoreSharedFilesChooseSitePage now expects to receive the full path to the file (file.toURL()) instead of the relative path.
- The following strings have been deprecated:
    core.dfdaymonthyear. Please use core.strftimedatefullshort instead.
    core.dfdayweekmonth. Please use core.strftimedayshort instead.
    core.dffulldate. Please use core.strftimedaydatetime instead.
    core.dfmediumdate. Please use core.strftimedaydatetime instead.
    core.dftimedate. Please use core.strftimetime instead.

3.5.2
=====

- CoreChartDirective changed from directive to component (CoreChartComponent) and the selector to use it changed from canvas[core-chart] to core-chart.
