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

import React from "react";
import PropTypes from "prop-types";

import styled from "../../../../shared/hocs/styled.jsx";

import * as formBase from "../../../../shared/styled/form/form-base.jsx";

import {
    scrollIntoViewIfNeeded,
} from "../../../utils/select-element";

export default class AvailableVoices extends React.PureComponent {
    constructor(props) {
        super(props);

        this.selectElement = null;

        this.handleChange = this.handleChange.bind(this);

        this.styled = {
            effectiveVoiceOption: styled({
                fontWeight: "bold",
            })(formBase.option),
        };
    }

    static defaultProps = {
        voices: [],
        value: null,
        defaultVoiceNameForSelectedLanguage: null,
        disabled: true,
    };

    static propTypes = {
        voices: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired,
            lang: PropTypes.string.isRequired,
        })).isRequired,
        value: PropTypes.string,
        defaultVoiceNameForSelectedLanguage: PropTypes.string,
        onChange: PropTypes.func.isRequired,
        disabled: PropTypes.bool.isRequired,
    };

    handleChange(e) {
        const voiceName = e.target.value;

        this.props.onChange(voiceName);

        scrollIntoViewIfNeeded(this.selectElement);
    }

    render() {
        const voicesOptions = this.props.voices.map(
            (voice) => {
                const isDefaultVoiceNameForSelectedLanguage = (
                    this.props.defaultVoiceNameForSelectedLanguage
                    && this.props.defaultVoiceNameForSelectedLanguage === voice.name
                );

                const VoiceOption = isDefaultVoiceNameForSelectedLanguage ? this.styled.effectiveVoiceOption : formBase.option;

                const defaultVoiceNameForSelectedLanguageMark = isDefaultVoiceNameForSelectedLanguage ? " ✓" : "";

                const voiceOptionText = `${voice.name}${defaultVoiceNameForSelectedLanguageMark}`;

                return <VoiceOption
                    key={voice.name}
                    // TODO: proper way to store/look up objects?
                    value={voice.name}
                >
                    {voiceOptionText}
                </VoiceOption>;
            }
        );

        return (
            <formBase.multiLineSelect
                id="voices-voices-list"
                size="7"
                onChange={this.handleChange}
                value={this.props.value || undefined}
                disabled={this.props.disabled || null}
                ref={
                    (selectElement) => {
                        this.selectElement = selectElement;
                        scrollIntoViewIfNeeded(this.selectElement);
                    }}
            >
                {voicesOptions}
            </formBase.multiLineSelect>
        );
    }
}
