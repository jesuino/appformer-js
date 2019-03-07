/*
 *  Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as React from "react";
import * as AppFormer from "appformer-js";
import * as Service from "./service";
import { NewSpacePopup } from "./NewSpacePopup";

interface Props {
  exposing: (self: () => SpacesScreen) => void;
}

interface State {
  spaces: Service.Space[];
  newSpacePopupOpen: boolean;
}

export class SpacesScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { spaces: [], newSpacePopupOpen: false };
    this.props.exposing(() => this);
  }

  private goToSpace(space: Service.Space) {
    Service.updateLibraryPreference({
      projectExplorerExpanded: false,
      lastOpenedOrganizationalUnit: space.name
    }).then(() => {
      (AppFormer as any).LibraryPlaces.goToSpace(space.name);
    });
  }

  private canCreateSpace() {
    return (AppFormer as any).LibraryPermissions.canCreateSpace();
  }

  private openNewSpacePopup() {
    if (this.canCreateSpace()) {
      this.setState({ newSpacePopupOpen: true });
    }
  }

  private closeNewSpacePopup() {
    this.setState({ newSpacePopupOpen: false });
  }

  public refreshSpaces() {
    Service.fetchSpaces().then(spaces => {
      this.setState({ spaces: spaces as Service.Space[] });
    });
  }

  public componentDidMount() {
    this.refreshSpaces();
  }

  public render() {
    return (
      <>
        {this.state.newSpacePopupOpen && <NewSpacePopup onClose={() => this.closeNewSpacePopup()} />}

        {this.state.spaces.length <= 0 && <EmptySpacesScreen onAddSpace={() => this.openNewSpacePopup()} />}

        {this.state.spaces.length > 0 && (
          <div className={"library container-fluid"}>
            <div className={"row page-content-kie"}>
              <div className={"toolbar-pf"}>
                <div className={"toolbar-pf-actions"}>
                  <div className={"toolbar-data-title-kie"}>Spaces</div>
                  <div className={"btn-group toolbar-btn-group-kie"}>
                    {this.canCreateSpace() && (
                      <button className={"btn btn-primary"} onClick={() => this.openNewSpacePopup()}>
                        {AppFormer.translate("CreateOrganizationalUnit", [
                          AppFormer.translate("OrganizationalUnitDefaultAliasInSingular", [])
                        ])}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className={"container-fluid container-cards-pf"}>
                <div className={"row row-cards-pf"}>
                  {this.state.spaces.map(space => (
                    <Tile key={space.name} space={space} onSelect={() => this.goToSpace(space)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

function EmptySpacesScreen(props: { onAddSpace: () => void }) {
  return (
    <div className={"library"}>
      <div className={"col-sm-12 blank-slate-pf"}>
        <div className={"blank-slate-pf-icon"}>
          <span className={"pficon pficon pficon-add-circle-o"} />
        </div>
        <h1>{AppFormer.translate("NothingHere", [])}</h1>
        <p>
          {AppFormer.translate("NoOrganizationalUnits", [
            AppFormer.translate("OrganizationalUnitDefaultAliasInPlural", []),
            AppFormer.translate("OrganizationalUnitDefaultAliasInSingular", [])
          ])}
        </p>
        <div className={"blank-slate-pf-main-action"}>
          <button className={"btn btn-primary btn-lg"} onClick={() => props.onAddSpace()}>
            {AppFormer.translate("CreateOrganizationalUnit", [
              AppFormer.translate("OrganizationalUnitDefaultAliasInSingular", [])
            ])}
          </button>
        </div>
      </div>
    </div>
  );
}

function Tile(props: { space: Service.Space; onSelect: () => void }) {
  return (
    <>
      <div className={"col-xs-12 col-sm-6 col-md-4 col-lg-3"}>
        <div
          className={"card-pf card-pf-view card-pf-view-select card-pf-view-single-select"}
          onClick={() => props.onSelect()}
        >
          <div className={"card-pf-body"}>
            <div>
              <h2 className={"card-pf-title"}> {props.space.name} </h2>
              <h5>{AppFormer.translate("NumberOfContributors", [props.space.contributors!.length.toString()])}</h5>
            </div>
            <div className={"right"}>
              <span className={"card-pf-icon-circle"}>{props.space.repositories!.length}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
