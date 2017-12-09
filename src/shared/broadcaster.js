/*
This file is part of Talkie -- text-to-speech browser extension button.
<https://joelpurra.com/projects/talkie/>

Copyright (c) 2016, 2017 Joel Purra <https://joelpurra.com/>

Talkie is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Talkie is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Talkie.  If not, see <https://www.gnu.org/licenses/>.
*/

import {
    logTrace,
    logWarn,
    logError,
} from "./log";

import {
    promiseTry,
} from "./promise";

import {
    isDeadWrapper,
} from "./tabs";

export default class Broadcaster {
    constructor() {
        this.actionRespondingMap = {};
        this.actionListeningMap = {};
    }

    unregisterRespondingAction(actionName, respondingActionHandler) {
        return promiseTry(
            () => {
                if (!this.actionRespondingMap[actionName]) {
                    throw new Error("No responding handler registered for action: " + actionName);
                }

                delete this.actionRespondingMap[actionName];
            }
        );
    }

    registerRespondingAction(actionName, respondingActionHandler) {
        return promiseTry(
            () => {
                if (this.actionRespondingMap[actionName]) {
                    throw new Error("Only one responding handler allowed at the moment for action: " + actionName);
                }

                this.actionRespondingMap[actionName] = respondingActionHandler;

                const killSwitch = () => {
                    // NOTE: the promise chain probably won't be completed (by the caller, outside of this function), as the kill switch might be executed during the "onunload" event.
                    return this.unregisterRespondingAction(actionName, respondingActionHandler);
                };

                return killSwitch;
            }
        );
    }

    unregisterListeningAction(actionName, listeningActionHandler) {
        return promiseTry(
            () => {
                if (!this.actionListeningMap[actionName]) {
                    throw new Error("No listening action(s) registered for action: " + actionName);
                }

                const countBefore = this.actionListeningMap[actionName].length;

                this.actionListeningMap[actionName] = this.actionListeningMap[actionName].filter((registeredListeningActionHandler) => registeredListeningActionHandler !== listeningActionHandler);

                const countAfter = this.actionListeningMap[actionName].length;

                if (countBefore === countAfter) {
                    throw new Error("The specific listening action handler was not registered for action: " + actionName);
                }
            }
        );
    }

    registerListeningAction(actionName, listeningActionHandler) {
        return promiseTry(
            () => {
                this.actionListeningMap[actionName] = (this.actionListeningMap[actionName] || []).concat(listeningActionHandler);

                const killSwitch = () => {
                    // NOTE: the promise chain probably won't be completed (by the caller, outside of this function), as the kill switch might be executed during the "onunload" event.
                    return this.unregisterListeningAction(actionName, listeningActionHandler);
                };

                return killSwitch;
            }
        );
    }

    broadcastEvent(actionName, actionData) {
        return promiseTry(
            () => {
                const respondingAction = this.actionRespondingMap[actionName] || null;
                const listeningActions = this.actionListeningMap[actionName] || [];

                if (respondingAction === null && listeningActions.length === 0) {
                    // NOTE: there was no matching action registered.
                    // throw new Error("There was no matching action: " + actionName);

                    logTrace("Skipping", "Sending message", actionName, actionData);

                    return undefined;
                }

                logTrace("Start", "Sending message", actionName, actionData);

                const listeningActionPromises = listeningActions.map((listeningAction) => {
                    return promiseTry(
                        () => {
                            // NOTE: check for dead objects from cross-page (background, popup, options, ...) memory leaks.
                            // NOTE: this is just in case the killSwitch hasn't been called.
                            // https://developer.mozilla.org/en-US/docs/Extensions/Common_causes_of_memory_leaks_in_extensions#Failing_to_clean_up_event_listeners
                            // TODO: throw error instead of cleaning up?
                            // TODO: clean up code to avoid memory leaks, primarly in Firefox as it doesn't have onSuspend at the moment.
                            if (isDeadWrapper(listeningAction)) {
                                logWarn("Dead wrapper", "Sending message", actionName, actionData, listeningAction);

                                return this.unregisterListeningAction(actionName, listeningAction);
                            }

                            return listeningAction(actionName, actionData);
                        });
                });

                return Promise.all(listeningActionPromises)
                    .then(() => {
                        if (respondingAction) {
                            return respondingAction(actionName, actionData);
                        }

                        return undefined;
                    })
                    .then(() => {
                        logTrace("Done", "Sending message", actionName, actionData);

                        return undefined;
                    })
                    .catch((error) => {
                        logError("Sending message", actionName, actionData);

                        throw error;
                    });
            })
            .catch((error) => {
                logError("catch", "Sending message", actionName, actionData);

                throw error;
            });
    }
}
