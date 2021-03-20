import {Injectable} from '@angular/core';
import {
  PortalRec, ColumnRecMetaData, RawData
} from '../project.data';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  // NEW March 8 2021
  public clipboard: PortalRec;

  userBootParamDocRef: AngularFirestoreDocument;
  adminBootParamDocRef: AngularFirestoreDocument;
  // metaDataDocRef: AngularFirestoreDocument;

  constructor(private firestore: AngularFirestore) {

    // get a reference to the AngularFirestoreDocuments
    this.userBootParamDocRef = this.firestore.collection('fs_boot_params').doc('fs_user');
    this.adminBootParamDocRef = this.firestore.collection('fs_boot_params').doc('fs_admin');
    ///////////////////////////   Boot Up  //////////////////////////

  }

  setMetaDataDoc(name: string): ColumnRecMetaData {
    // Create template partially filled
    const date = new Date().toISOString();
    const id = '_first_sat:' + date;
    const rawData: RawData = {
      id, name, columns: []
    };
    const colRecData: ColumnRecMetaData = {
      rawDataId: rawData.id,
      id: '_metadata',
      rawData
    };
    // create new ColRec collection and set it's _metadata document
    this.firestore.collection(id).doc('_metadata').set(colRecData).then(value => {
      console.log('setportal return value: ' + JSON.stringify(value));
    }).catch(reason => {
      console.log('setColumnRecData ERROR reason: ' + JSON.stringify(reason));
    });
    return colRecData;
  }

  // TODO replace
  // getPortalRecs(path: string): any{
  //  return this.firestore.collection(path).snapshotChanges();
  // }

  getColumnRecMetaData(projectId: string): AngularFirestoreDocument {
    const ref: AngularFirestoreDocument = this.firestore.collection(projectId).doc('_metadata');
    return ref;
  }

  updateRawDataPortalRec(metaData: ColumnRecMetaData): void {
    // delete project.id;
    this.firestore.doc( metaData.rawDataId + '/_metadata').update(metaData).catch((reason) => {
      console.log(reason);
    });
  }

}
