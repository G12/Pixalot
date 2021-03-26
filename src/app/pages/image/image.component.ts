import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {ProjectService} from '../../services/project.service';
import {Admin, AdminList, BootParam, Column, ColumnRecMetaData, LocalData, PortalRec, ProjectList, RawData} from '../../project.data';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.css']
})
export class ImageComponent implements OnInit, AfterViewInit {

  static top = 'top';
  static bottom = 'bottom';
  static right = 'right';
  static left = 'left';
  static lineWidth = 6;
  static offset = 3;

  ///////////////////////// Test

  /////////////////////////   Production Data
  portalRecs: PortalRec[];
  columnRecMetaData: ColumnRecMetaData;
  rawData: RawData;

  //////////////////////////// user info /////////////////////////////
  googleUID: string;
  isAdmin = false;
  adminList: AdminList;
  projectList: ProjectList;
  fsUser: BootParam;
  fsAdmin: BootParam;

  //////////////////////////// firestore
  bootSubscription: Subscription;
  portalRecsSubscription: Subscription;

  /////////////////////////////  UI
  @ViewChild('overlayEl') overlayEl: ElementRef;
  overlayCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  @ViewChild('underlayEl') fsImageEl: ElementRef;
  fsImageCanvas: HTMLCanvasElement;
  private imgCtx: CanvasRenderingContext2D;

  @ViewChild('imageEl') imageEl: ElementRef;
  image: HTMLImageElement;

  // https://fevgames.net/ifs/ifsathome/2021-02/526512664310392819101497600819769.jpg
  // https://fevgames.net/ifs/ifsathome/2021-03/17631729871888592910113823558419958.jpg
  // url = 'https://fevgames.net/ifs/ifsathome/2021-03/17631729871888592910113823558419958.jpg';
  // https://fevgames.net/ifs/ifsathome/2021-01/10941061976107631417246021719483.jpg
  // https://fevgames.net/ifs/ifsathome/2020-12/2053177885416771131201298204919273.jpg
  path = 'https://geopad.ca/fs_pics/';
  thumb: string;
  src: string;
  width: number;
  height: number;

  currentColumn: Column;
  gold = '#ffcc66';
  lightgray = '#cccccc';
  transparent = 'transparent';

  isFraming = false;
  isColumnSet = false;
  busy = false;
  brdRGBA: LocalData['rgba']; // = [254, 0, 0, 255];
  noRGBA = true;
  private imgData: ImageData;

  ////////////////////   Web Worker
  private number;
  output = 0;
  private worker: Worker;

  constructor(public authService: AuthService,
              private projectService: ProjectService) {
  }

  ///////////////  initialization helper methods //////////////////////

  ngOnInit(): void {

    this.authService.afAuth.currentUser.then(value => {
      this.googleUID = value.uid;
      this.getAdminAndProjectLists();
    });

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./../../app.worker', {type: 'module'});
      this.worker.onmessage = ({data}) => {
        this.output = data;
      };
    }
    /*
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker('./../../app.worker', { type: 'module' });
      this.worker.onmessage = ({ data }) => {
        console.log(`page got message: ${data}`);
      };
      this.worker.postMessage('hello');
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
     */
  }

  ngAfterViewInit(): void {
  }

  logout(): void {
    if (confirm('Log Out?')) {
      this.authService.logout();
    }
  }

  imageLoaded(imageEl: HTMLImageElement): void {
    console.log('naturalWidth: ' + imageEl.naturalWidth + ' naturalHeight: ' + imageEl.naturalHeight);
    this.width = imageEl.naturalWidth;
    this.height = imageEl.naturalHeight;
    this.image = imageEl;
    this.startUp();
  }

  startUp(): void {
    console.log('Width: ' + this.width + ' Height: ' + this.height);
    this.overlayCanvas = this.overlayEl.nativeElement;
    this.ctx = this.overlayCanvas.getContext('2d');
    this.overlayCanvas.addEventListener('mousedown', (ev => {

      if (this.noRGBA) {
        const xy = this.getXY(ev, this.overlayCanvas);
        let testRGB;
        let str;
        setTimeout(() => {
          if (!this.imgData) {
            console.log('Pick Red Click ctx.getImageData');
            this.imgData = this.imgCtx.getImageData
            (0, 0, this.fsImageCanvas.width, this.fsImageCanvas.height);
          }
          testRGB = this.getPixelXY(this.imgData, xy[0], xy[1]);
          str = JSON.stringify(testRGB);
          if (confirm('Use Backround color: ' + str)) {
            this.brdRGBA = testRGB;
            this.noRGBA = false;
          }
        });
      } else if (this.isColumnSet) {
        if (confirm('Set Next Column for here?')) {
          this.pickColumnPositions(ev, this.overlayCanvas);
        }
      } else if (this.isFraming) {
        // Draw the bounding box
        if (!this.busy) {
          this.busy = true;
          // TODO search to see if bounding box exists at this position
          if (this.boxExists(ev, this.overlayCanvas)) {
            alert('Exists BEEP');
            return;
          }
          console.log('overlayCanvas.width: ' + this.overlayCanvas.width +
            ' fsImageCanvas.width: ' + this.fsImageCanvas.width);
          this.getBoundingBox(ev, this.overlayCanvas);
        } else {
          alert('Sorry Busy Now!');
        }
      } else {
        if (this.rawData.columns.length === 0) {
          alert('Start setting column positions');
          this.isColumnSet = true;
          return;
        }
        if (confirm('Confirm to continue setting columns.')) {
          this.isColumnSet = true;
        }
      }
    }));
    this.fsImageCanvas = this.fsImageEl.nativeElement;
    // KLUDGE HERE may need to increase timeout
    setTimeout(e => this.drawCanvas(), 500);
  }

  drawCanvas(): void {
    this.imgCtx = this.fsImageCanvas.getContext('2d');
    this.imgCtx.drawImage(this.image, 0, 0, this.width, this.height);
    this.drawFrames(this.ctx);
  }

  ////////////   After here the image and canvases are loaded
  ////////////   Now we can work with data

  ////////////////////////////  Mouse Event methods ////////////////////////////
  pickColumnPositions(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const xy = this.getXY(event, canvas);
    const offset = xy[0];
    const i = this.rawData.columns.length;
    const lastOffset = i > 0 ? this.rawData.columns[i - 1].offset : 0;
    const char = String.fromCharCode(65 + i);
    const width = offset - lastOffset - 2; // minus border width 2
    const col: Column = {name: char, offset, width, portals: []};
    this.rawData.columns.push(col);
    console.log(JSON.stringify(this.rawData));
    this.columnRecMetaData.rawData = this.rawData;
    this.projectService.updateRawDataPortalRec(this.columnRecMetaData);
  }

  /////////////////////////// Action Buttons loading data etc.

  createNewProject(): void {
    const projName = prompt('Enter the fs_pics/folderName for the red and black images.');
    if (projName) {
      this.thumb = this.path + projName + '/black.jpg';
      this.newProject(projName);
    } else {
      console.log('Canceled');
    }
  }

  setUserProject(): void {
    if (confirm('Set the fs_user data using: ' + this.fsAdmin.folder)) {
      const bootParams: BootParam = {
        project_id: this.rawData.id,
        folder: this.fsAdmin.folder
      };
      this.projectService.userBootParamDocRef.set(bootParams);
    }
  }

  newProject(name: string): void {
    if (this.bootSubscription) {
      this.bootSubscription.unsubscribe();
    }
    if (this.portalRecsSubscription) {
      this.portalRecsSubscription.unsubscribe();
    }
    this.columnRecMetaData = this.projectService.setMetaDataDoc(name);
    this.rawData = this.columnRecMetaData.rawData;
    // set the current project id and folder to the admin boot params
    const bootParams: BootParam = {
      project_id: this.rawData.id,
      folder: name
    };
    this.projectService.adminBootParamDocRef.set(bootParams).then(value => {
      this.projectList.projects.push(bootParams);
      this.projectService.projectListBootDocRef.set(this.projectList);
      // console.log('return: ' + JSON.stringify(value));
    }).catch(reason => {
      // console.log('reason: ' + JSON.stringify(reason));
    });
  }

  setAdmin(name: string, uid: string): void {
    const admin: Admin = {name, uid};
    const adminList: AdminList = {admins: []};
    adminList.admins.push(admin);
    this.projectService.adminListBootDocRef.set(adminList);
  }

  getAdminAndProjectLists(): void {
    this.projectService.bootParamsCollection.get().subscribe(data => {
      if (!data.empty) {
        const projLst = data.docs.find(d => d.id === 'project_list');
        if (projLst) {
          this.projectList = projLst.data() as ProjectList;
        } else {
          this.projectList = {projects: []};
        }
        const admlst = data.docs.find(d => d.id === 'admin_list');
        if (admlst) {
          this.adminList = admlst.data() as AdminList;
        }
      }
    });
  }

  getBootParams(): void {
    // TODO add UI procedure for assigning admin status this.setAdmin('G12mo', '1KYU0BdE0rXTly5Y5KZslOvxpow2');
    this.projectService.bootParamsCollection.get().subscribe(data => {
      if (!data.empty) {
        /*
        const projLst = data.docs.find(d => d.id === 'project_list');
        if (projLst) {
          this.projectList = projLst.data() as ProjectList;
        } else {
          this.projectList = {projects: []};
        }
        const admlst = data.docs.find(d => d.id === 'admin_list');
        if (admlst) {
          this.adminList = admlst.data() as AdminList;
        }
         */
        const usr = data.docs.find(d => d.id === 'fs_user');
        if (usr) {
          this.fsUser = usr.data() as BootParam;
        }
        const adm = data.docs.find(d => d.id === 'fs_admin');
        if (adm) {
          this.fsAdmin = adm.data() as BootParam;
        }
        const test = this.adminList.admins.find(a => a.uid === this.googleUID);
        this.isAdmin = !!test;
        if (this.fsAdmin) {
          const id = this.fsAdmin.project_id;
          const folder = this.fsAdmin.folder;
          if (confirm('Open for testing Locally')) {
            this.src = 'assets/red.jpg';
          } else {
            this.src = this.path + folder + '/red.jpg';
          }
          this.thumb = this.path + folder + '/black.jpg';
          // Once we have default project id we can get the data
          this.getColumnRecMetaData(id);
        }
      }
    });
  }

  openCurrenProject(): void {
    this.getBootParams();
  }

  selectColumn(column: Column): void {
    if (this.isFraming) {
      console.log('currentColumn: ', this.currentColumn);
      this.columnRecMetaData.rawData = this.rawData;
      this.projectService.updateRawDataPortalRec(this.columnRecMetaData);
      // Carry on
      this.currentColumn = null;
      this.isColumnSet = true;
      this.isFraming = false;
    } else {
      this.currentColumn = column;
      this.isColumnSet = false;
      this.isFraming = true;
    }
  }

  //////////////////////  Utilities ////////////////////////////
  getColumnRecMetaData(projectId: string): void {
    const sub = this.projectService.getColumnRecMetaData(projectId).get().subscribe(data => {
      if (data.exists) {
        this.columnRecMetaData = data.data() as ColumnRecMetaData;
        this.rawData = this.columnRecMetaData.rawData;
        sub.unsubscribe();
      }
    });
  }

  drawFrames(ctx: CanvasRenderingContext2D): void {
    this.rawData.columns.forEach(column => {
      column.portals.forEach(prtl => {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = ImageComponent.lineWidth;
        ctx.strokeRect(prtl.l, prtl.t, prtl.r, prtl.b);
      });
    });
  }

  // Make sure all work is done in the selected column
  getBorderRec(event: MouseEvent, canvas: HTMLCanvasElement): boolean {
    const xy = this.getXY(event, canvas);
    const x = xy[0];
    // test if in current column
    if (!(x < this.currentColumn.offset && x > (this.currentColumn.offset - this.currentColumn.width))) {
      alert('Pick only from column ' + this.currentColumn.name);
      // this.busy = false;
      return false;
    }
    return true;
  }

  /////////////////////////////// Drawing bounding box code
  getBoundingBox(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const xy = this.getXY(event, canvas);
    const x = xy[0];
    const y = xy[1];
    console.log('getBoundingBox x: ' + x + ' y: ' + y);
    if (!this.currentColumn || this.currentColumn.width === 0) {
      alert('Pick a column to work on');
      this.busy = false;
      return;
    }
    // test if in current column
    if (!(x < this.currentColumn.offset && x > (this.currentColumn.offset - this.currentColumn.width))) {
      alert('Pick only from column ' + this.currentColumn.name);
      this.busy = false;
      return;
    }
    setTimeout(() => {
      let localData: LocalData;
      const max = 10;
      let exit = max;
      while (exit > 0) {
        // console.log('LEFT exit: ' + exit);
        localData = this.findEdge(this.imgData, x, y, ImageComponent.left);
        if (localData) {
          break;
        }
        exit--;
      }
      // NOTE all l r t b values are adjusted to make bounding box slightly smaller
      const fudge = 2;
      let l = localData ? (localData.rec[0] + fudge) : null;
      // console.log('left: ' + l);
      exit = max;
      while (exit > 0) {
        // console.log('RIGHT exit: ' + exit);
        localData = this.findEdge(this.imgData, x, y, ImageComponent.right);
        if (localData) {
          break;
        }
        exit--;
      }
      let r = localData ? (localData.rec[0] - l - fudge) : null;
      // console.log('right: ' + r);
      exit = max;
      while (exit > 0) {
        // console.log('TOP exit: ' + exit);
        localData = this.findEdge(this.imgData, x, y, ImageComponent.top);
        if (localData) {
          break;
        }
        exit--;
      }
      let t = localData ? (localData.rec[1] + fudge) : null;
      // console.log('top: ' + t);
      exit = max;
      while (exit > 0) {
        // console.log('BOTTOM exit: ' + exit);
        localData = this.findEdge(this.imgData, x, y, ImageComponent.bottom);
        if (localData) {
          break;
        }
        exit--;
      }
      let b = localData ? (localData.rec[1] - t - fudge) : null;
      // console.log('bottom: ' + b);
      if (l && r && t && b) {
        // expand frame by 2 pixels
        l = l - ImageComponent.offset;
        r = r + ImageComponent.offset;
        t = t - ImageComponent.offset;
        b = b + ImageComponent.offset;

        // console.log('Left: ' + l + ' Width: ' + r + ' Top: ' +  t + ' Height: ' + b);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = ImageComponent.lineWidth;
        this.ctx.strokeRect(l, t, r, b);

        const col = this.currentColumn;
        const index = col.portals.length + 1;
        const portal: PortalRec = {rawDataId: this.rawData.id, index, colName: col.name, l, t, r, b};
        col.portals.push(portal);

      } else {
        console.log('MISSING coordinate values');
        // TODO why do this
        alert('Failed to Find!');
      }
      this.busy = false;
    });
  }


  findEdge(imgData, xMouse, yMouse, side): LocalData {
    const rgbData = this.brdRGBA;
    let x = xMouse;
    let y = yMouse;
    // let testRGB: LocalData['rgba'];
    // testRGB = this.getPixelXY(imgData, x, y);
    const incr = (side === ImageComponent.top || side === ImageComponent.left) ? -1 : 1;
    let foundData: LocalData;
    /////////////////////////// Right and Left Boundaries //////////////////
    if (side === ImageComponent.right || side === ImageComponent.left) {
      while (true) {
        foundData = this.getEdgeData(imgData, x, y, rgbData);
        if (foundData) {
          // console.log(side + ' SUCCESS searched ' + Math.abs(x - xMouse) + ' pixels');
          return foundData;
        }
        x = x + incr;
        if (Math.abs(x - xMouse) > 300) {
          console.log(side + ' FAILED searched ' + Math.abs(x - xMouse) + ' pixels');
          return null;
        }
      }
    } else {
      ////////////////////////// Top and Bottom Boundaries
      while (true) {
        foundData = this.getEdgeData(imgData, x, y, rgbData);
        if (foundData) {
          // console.log(side + ' SUCCESS searched ' + Math.abs(y - yMouse) + ' pixels');
          return foundData;
        }
        y = y + incr;
        if (Math.abs(y - yMouse) > 300) {
          console.log(side + ' FAILED searched ' + Math.abs(y - yMouse));
          return null;
        }
      }
    }
  }

  // Get x and y even if canvas bounds x and y have been adjusted ie making a slice
  private getXY(event: MouseEvent, canvas: HTMLCanvasElement): any {
    const rect = canvas.getBoundingClientRect();

    console.log(JSON.stringify(rect) + ' event.clientX ' + event.clientX + 'event.clientY' + event.clientY);

    // NOTE round off to an int to be able to index into the array of pixels - see getPixel
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    return [x, y];
  }

  private getPixelXY(imgData, x, y): any {
    const width = imgData.width;
    const index = y * width + x;
    console.log(y + ' * ' + width + ' + ' + x + ' = ' + index);
    console.log('imgData.width: ' + imgData.width + ' index: ' + index);
    return this.getPixel(imgData, index);
  }

  private getPixel(imgData, index): LocalData['rgba'] {
    const i = index * 4;
    const d = imgData.data;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]]; // Returns array [R,G,B,A]
  }

  private boxExists(event: MouseEvent, canvas: HTMLCanvasElement): boolean {
    const xy = this.getXY(event, canvas);
    const x = xy[0];
    const y = xy[1];
    this.rawData.columns.forEach(col => {
      col.portals.forEach(p => {
        if ((y > p.t && y < p.b) && (x > p.l && x < p.r)) {
          return true;
        }
      });
    });
    return false;
  }

  private compareArrays(rgbData: LocalData['rgba'], b: LocalData['rgba']): boolean {
    const equals = (x, y) => JSON.stringify(rgbData) === JSON.stringify(b);
    return equals(rgbData, b);
  }

  private getEdgeData(imgData, x, y, rgbData): LocalData {
    let b: LocalData['rgba'];
    console.log('getPixelXY(' + x + ',' + y + ')');
    b = this.getPixelXY(imgData, x, y);
    if (this.compareArrays(rgbData, b)) {
      return {rgba: b, rec: [x, y]};
    } else {
      return null;
    }
  }

  /*
  setImgData(): void {
    this.imgData = this.imgCtx.getImageData(0, 0, 100, 100);
    // this.imgData = this.imgCtx.getImageData(0, 0, this.width, this.height );
    console.log('imgData.width: ' + this.imgData.width + ' imgData.height: ' + this.imgData.height);
  }
   */

  getColColor(column: Column): string {
    if (!this.currentColumn) {
      return this.transparent;
    }
    return this.currentColumn.name === column.name ? this.gold : this.transparent;
  }

  testWorker(): void {
    this.number = 14;
    this.worker.postMessage(this.number);
    /*
    if (typeof Worker !== 'undefined') {
      // Create a new
      const worker = new Worker('./../../app.worker', { type: 'module' });
      worker.onmessage = ({ data }) => {
        console.log(`page got message: ${data}`);
      };
      worker.postMessage('hello');
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
     */
  }

}
