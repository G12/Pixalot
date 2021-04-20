import {Injectable} from '@angular/core';
import {
  PortalRec, ColumnRecMetaData
} from '../project.data';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  // NEW March 8 2021
  public clipboard: PortalRec;

  userBootParamDocRef: AngularFirestoreDocument;
  adminBootParamDocRef: AngularFirestoreDocument;
  adminListBootDocRef: AngularFirestoreDocument;
  projectListBootDocRef: AngularFirestoreDocument;
  bootParamsCollection: AngularFirestoreCollection;
  // metaDataDocRef: AngularFirestoreDocument;

  constructor(private firestore: AngularFirestore) {

    // get a reference to the AngularFirestoreDocuments
    this.userBootParamDocRef = this.firestore.collection('fs_boot_params').doc('fs_user');
    this.adminBootParamDocRef = this.firestore.collection('fs_boot_params').doc('fs_admin');
    this.adminListBootDocRef = this.firestore.collection('fs_boot_params').doc('admin_list');
    this.projectListBootDocRef = this.firestore.collection('fs_boot_params').doc('project_list');
    this.bootParamsCollection = this.firestore.collection('fs_boot_params');
    ///////////////////////////   Boot Up  //////////////////////////

  }
  ///////////////////////////// initialize _MsgLog /////////////////////////
  getMsgLogDoc(id: string): AngularFirestoreDocument {
    return this.firestore.collection(id).doc('_MsgLog');
  }

  //////////////////////////// initialize _metadata  ////////////////////////
  getMetadataDoc(id: string): AngularFirestoreDocument {
    return this.firestore.collection(id).doc('_metadata');
  }

  getColumnRecMetaData(projectId: string): AngularFirestoreDocument {
    return this.firestore.collection(projectId).doc('_metadata');
  }

  updateRawData(metaData: ColumnRecMetaData): Promise<void> {
    return this.firestore.doc( metaData.rawDataId + '/_metadata').update(metaData);
    // .catch((reason) => { console.log(reason); });
  }

}
