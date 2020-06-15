/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import { SpinalContextApp } from 'spinal-env-viewer-context-menu-service';
import { SpinalGraphService } from 'spinal-env-viewer-graph-service';
import {
  CONTEXT_TYPE,
  EQUIPMENT_TYPE,
  SITE_RELATION,
  BUILDING_RELATION,
  ZONE_RELATION,
  FLOOR_RELATION,
  ROOM_RELATION,
  EQUIPMENT_RELATION,
  REFERENCE_RELATION
} from 'spinal-env-viewer-context-geographic-service/build/constants';

const LABEL = 'Update BimObject Ids';
const NODE_TYPE = 'BimFile';

async function updateBimObjectId(bimObjects) {
  const mapModelExternId = new Map();
  const updated = [];

  function getExternalIdMapping(model) {
    if (mapModelExternId.has(model)) return mapModelExternId.get(model);
    const prom = new Promise((resolve) => {
      model.getExternalIdMapping((map) => {
        resolve(map);
      });
    });
    mapModelExternId.set(model, prom);
    return prom;
  }

  console.log("updateBimObjectId - number of items :", bimObjects.length);
  for (const bimObj of bimObjects) {
    const bimFileId = bimObj.info.bimFileId.get();
    const model = window.spinal.BimObjectService.getModelByBimfile(bimFileId);
    // eslint-disable-next-line no-await-in-loop
    const externalIdMapping = await getExternalIdMapping(model);
    const externalId = bimObj.info.externalId.get();
    if (bimObj.info.dbid.get() !== externalIdMapping[externalId]) {
      updated.push(externalIdMapping[externalId]);
      bimObj.info.dbid.set(externalIdMapping[externalId]);
    }
  }
  console.log("End");
  if (updated.length > 0) console.log('UPDATED', updated);
}

export class UpdateBimObjectIdBtn extends SpinalContextApp {
  constructor() {
    super(LABEL, LABEL, {
      icon: 'playlist_add_check',
      icon_type: 'in',
      backgroundColor: '#000000',
      fontColor: '#ffffff'
    });
  }
  isShown(option) {
    if (option.selectedNode.type.get() === NODE_TYPE) {
      return Promise.resolve(true);
    }
    return Promise.resolve(-1);
  }

  async action(option) {
    const nodeId = option.selectedNode.id.get();
    const rNode = SpinalGraphService.getRealNode(nodeId);
    const bimObjects = [];








    const bimContexts = await rNode.getChildren("hasBimContext");
    for (const bimContext of bimContexts) {
      // eslint-disable-next-line no-await-in-loop
      const bimObj = await bimContext.getChildren("hasBimObject");
      bimObjects.push(...bimObj);
    }
    return updateBimObjectId(bimObjects);
  }
}



export class SpatialContextUpdateBimObjectIdBtn extends SpinalContextApp {
  constructor() {
    super(LABEL, LABEL, {
      icon: 'playlist_add_check',
      icon_type: 'in',
      backgroundColor: '#000000',
      fontColor: '#ffffff'
    });
  }
  isShown(option) {
    if (option.selectedNode.type.get() === CONTEXT_TYPE) {
      return Promise.resolve(true);
    }
    return Promise.resolve(-1);
  }

  async action(option) {
    const nodeId = option.selectedNode.id.get();
    const rNode = SpinalGraphService.getRealNode(nodeId);
    const bimObjects = new Set();

    const geoRelations = [
      SITE_RELATION,
      BUILDING_RELATION,
      ZONE_RELATION,
      FLOOR_RELATION,
      ROOM_RELATION,
      EQUIPMENT_RELATION,
      REFERENCE_RELATION,
      "hasReferenceObject.ROOM"
    ];

    await rNode.find(geoRelations, (node) => {
      if (typeof node.info.externalId !== "undefined" &&
        typeof node.info.dbid !== "undefined") {
        bimObjects.add(node);
      }
      return false;
    });
    return updateBimObjectId(bimObjects);
  }
}
