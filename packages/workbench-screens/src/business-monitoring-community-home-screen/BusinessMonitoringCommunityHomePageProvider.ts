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

import * as HomeApi from "../home-screen-api";
import { Profile } from "@kiegroup-ts-generated/kie-wb-common-profile-api";
import * as AppFormer from "appformer-js";

export class BusinessMonitoringCommunityHomePageProvider implements HomeApi.HomeScreenProvider {
  public get(profile: Profile): HomeApi.HomeScreen {
    const welcomeText = AppFormer.translate("Heading", []);
    const description = AppFormer.translate("SubHeading", []);
    const backgroundImageUrl = "images/community_home_bg.jpg";

    return new HomeApi.HomeScreen(welcomeText, description, backgroundImageUrl, this.buildCardsForProfile(profile));
  }

  private buildCardsForProfile(profile: Profile) {
    switch (profile) {
      case Profile.PLANNER_AND_RULES:
        return [this.designCard(), this.deployCard()];
      case Profile.FULL:
      default:
        return [this.designCard(), this.deployCard(), this.manageCard(), this.trackCard()];
    }
  }

  private designCard() {
    const cssClasses = ["pficon", "pficon-blueprint"];
    const title = AppFormer.translate("Design", []);
    const descriptionTextMask = AppFormer.translate("DesignRuntimeDescription", []);
    const description = new HomeApi.CardDescriptionBuilder(descriptionTextMask)
      .addLink(AppFormer.translate("HomeProducer.Pages", []), "ContentManagerPerspective")
      .build();

    return new HomeApi.Card(cssClasses, title, description, "ContentManagerPerspective");
  }

  private deployCard() {
    const cssClasses = ["fa", "fa-gears"];
    const title = AppFormer.translate("Deploy", []);
    const serverManagementPerspective = "ServerManagementPerspective";

    const deploymentAuthorized = HomeApi.AuthorizationManager.hasAccessToPerspective(serverManagementPerspective);

    const description = new HomeApi.CardDescriptionBuilder(this.getDeployCardDescription(deploymentAuthorized))
      .addLinkIf(
        () => deploymentAuthorized,
        AppFormer.translate("HomeProducer.Provisioning", []),
        "ProvisioningManagementPerspective"
      )
      .addLink(AppFormer.translate("HomeProducer.Servers", []), serverManagementPerspective)
      .build();

    return new HomeApi.Card(cssClasses, title, description, serverManagementPerspective);
  }

  private manageCard() {
    const cssClasses = ["fa", "fa-briefcase"];
    const title = AppFormer.translate("Manage", []);

    const descriptionTextMask = AppFormer.translate("ManageDescription", []);
    const description = new HomeApi.CardDescriptionBuilder(descriptionTextMask)
      .addLink(AppFormer.translate("HomeProducer.ProcessDefinitions", []), "ProcessDefinitions")
      .addLink(AppFormer.translate("HomeProducer.ProcessInstances", []), "ProcessInstances")
      .addLink(AppFormer.translate("HomeProducer.Tasks", []), "TaskAdmin")
      .addLink(AppFormer.translate("HomeProducer.Jobs", []), "Requests")
      .addLink(AppFormer.translate("HomeProducer.ExecutionErrors", []), "ExecutionErrors")
      .build();

    return new HomeApi.Card(cssClasses, title, description, "ProcessInstances");
  }

  private trackCard() {
    const cssClasses = ["pficon", "pficon-trend-up"];
    const title = AppFormer.translate("Track", []);

    const descriptionTextMask = AppFormer.translate("TrackDescription", []);
    const description = new HomeApi.CardDescriptionBuilder(descriptionTextMask)
      .addLink(AppFormer.translate("HomeProducer.TaskInbox", []), "Tasks")
      .addLink(AppFormer.translate("HomeProducer.ProcessReports", []), "ProcessDashboardPerspective")
      .addLink(AppFormer.translate("HomeProducer.TaskReports", []), "TaskDashboardPerspective")
      .build();

    return new HomeApi.Card(cssClasses, title, description, "ProcessDashboardPerspective");
  }

  private getDeployCardDescription(deploymentAuthorized: boolean) {
    if (deploymentAuthorized) {
      return AppFormer.translate("DeployDescription2", []);
    }

    return AppFormer.translate("DeployDescription1", []);
  }
}
