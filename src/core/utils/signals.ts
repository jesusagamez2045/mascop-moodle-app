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

import {
    CreateEffectOptions,
    effect,
    EffectCleanupRegisterFn,
    EffectRef,
    Injector,
} from '@angular/core';

/**
 * Return an effect wrapper that can be used to create an effect with a certain injection context.
 * Example:
 *
 * ```
 * const effectWrapper = effectWithInjectionContext(injector);
 *
 * effectWrapper(() => {
 *    // Your effect code here.
 * });
 * ```
 *
 * @param injector Injector to use for the effect.
 * @returns Function to create the effect.
 */
export function effectWithInjectionContext(injector: Injector): typeof effect {
    return (
        effectFn: (onCleanup: EffectCleanupRegisterFn) => void,
        options?: Omit<CreateEffectOptions, 'injector'>,
    ): EffectRef =>
        effect(effectFn, {
            ...options,
            injector,
        });
}
