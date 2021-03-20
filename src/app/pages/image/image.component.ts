import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {ProjectService} from '../../services/project.service';
import {BootParam, Column, ColumnRecMetaData, PortalRec, RawData} from '../../project.data';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.css']
})
export class ImageComponent implements OnInit, AfterViewInit {
  ///////////////////////// Test

  /////////////////////////   Production Data
  portalRecs: PortalRec[];
  columnRecMetaData: ColumnRecMetaData;
  rawData: RawData;

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
  path = 'https://geopad.ca/fs_pics/';
  thumb: string;
  src: string;
  width: number;
  height: number;

  constructor(public authService: AuthService,
              private projectService: ProjectService) {
  }

  ///////////////  initialization helper methods //////////////////////

  ngOnInit(): void {
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
    this.overlayCanvas.addEventListener('mousedown', (ev => {

      this.pickColumnPositions(ev, this.overlayCanvas);

    }));
    this.fsImageCanvas = this.fsImageEl.nativeElement;
    this.imgCtx = this.fsImageCanvas.getContext('2d');

    // KLUDGE HERE may need to increase timeout
    setTimeout(e => this.drawCanvas(), 500);

  }

  drawCanvas(): void {
    this.imgCtx.drawImage(this.image, 0, 0, this.width, this.height);
  }

  ////////////   After here the image and canvases are loaded
  ////////////   Now we can work with data

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
  columnClick(column: Column): void {
    alert(JSON.stringify(column));
  }

  createNewProject(): void {
    const projName = prompt('Enter the fs_pics/folderName for the red and black images.');
    if (projName) {
      this.thumb = this.path + projName + '/black.jpg';
      this.newProject(projName);
    } else {
      console.log('Canceled');
    }
  }

  newProject(name: string): void {
    if (this.bootSubscription){ this.bootSubscription.unsubscribe(); }
    if (this.portalRecsSubscription) { this.portalRecsSubscription.unsubscribe(); }
    this.columnRecMetaData = this.projectService.setMetaDataDoc(name);
    this.rawData = this.columnRecMetaData.rawData;
    // set the current project id and folder to the admin boot params
    this.projectService.adminBootParamDocRef.set({
      project_id: this.rawData.id,
      folder: name
    }).then(value => {
      // console.log('return: ' + JSON.stringify(value));
    }).catch(reason => {
      // console.log('reason: ' + JSON.stringify(reason));
    });
  }

  openCurrenProject(): void {
    this.bootSubscription = this.projectService.adminBootParamDocRef.get().subscribe(data => {
      if (data.exists) {
        const adminBootParam = data.data() as BootParam;
        const id = adminBootParam.project_id;
        const folder = adminBootParam.folder;
        this.src = this.path + folder + '/red.jpg';
        this.thumb = this.path + folder + '/black.jpg';
        // Once we have default project id we can the data
        this.getColumnRecMetaData(id);
      } else {
        // doc.data() will be undefined in this case
      }
    });
  }

  getColumnRecMetaData(projectId: string): void {
    const sub = this.projectService.getColumnRecMetaData(projectId).get().subscribe(data => {
      if (data.exists) {
        this.columnRecMetaData = data.data() as ColumnRecMetaData;
        this.rawData = this.columnRecMetaData.rawData;
        sub.unsubscribe();
      }
    });
  }

  //////////////////////  Utilities ////////////////////////////
  // Get x and y even if canvas bounds x and y have been adjusted ie making a slice
  private getXY(event: MouseEvent, canvas: HTMLCanvasElement): any {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y];
  }

  testCurrentData(): void {
    alert(JSON.stringify(this.columnRecMetaData));
  }
}
