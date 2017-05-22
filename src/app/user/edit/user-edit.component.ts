import { Component, ElementRef, OnInit, AfterViewChecked, EventEmitter } from '@angular/core';
import { User } from '../common/user';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser/';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { UserService } from '../common/user.service';
import { AuthService } from '../../auth.service';
import { FormConstantsService } from '../../_services/form-constants.service';
import { ImageUploaderService, ImageReaderResponse } from '../../_services/image-uploader.service';

import { MaterializeAction } from 'angular2-materialize';

declare var Materialize: any;

@Component({
  selector: 'my-edit-user',
  templateUrl: 'user-edit.component.html',
  styleUrls: ['user-edit.component.scss']
})

export class UserEditComponent implements OnInit, AfterViewChecked {

  public userForm: FormGroup;
  public user: User;
  public countries: any[];
  public selectedUser: User;
  public formPlaceholder: { [key: string]: any } = {};
  public descMaxLength = 255;
  public states: String[];
  public loadedFile: any;
  public userId;
  public displayPhone = false;
  public displayProfile = false;
  public checkPublish = false;
  public checkNotify = false;
  private defaultAvatar = '../../../assets/default_image.png';
  public globalActions = new EventEmitter<string|MaterializeAction>();
  modalActions = new EventEmitter<string|MaterializeAction>();
  public avatar: any = '';
  public skillsOption = [{value: '1', name: 'CSS'},
    {value: '2', name: 'option2'},
    {value: '3', name: 'python'}];
  currentUserId: String;

  constructor(
    public fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService,
    private fc: FormConstantsService,
    private el: ElementRef,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private imageUploader: ImageUploaderService
  ) { }

  ngOnInit(): void {

    this.getFormConstants();
    this.initForm();

    this.route.params.subscribe(params => {
      // this.user.avatar = '';
      this.userId = +params['userId'];
      this.currentUserId = this.auth.getCurrentUserId();

      this.userService.getUser(this.userId)
        .subscribe(
          res => {
          this.user = res;
          this.avatar = this.user.avatarUrl;
          this.checkRole(this.user.role);
          this.checkFlag();
          this.fillForm();
          }, error => console.log(error)
        );

      // NOTE: Logo retrieval is a temporary fix until form can be properly submitted with logo
      // return this.userService.retrieveLogo(this.organizationId).toPromise();
      // const logoText = res.text();
      // const logoBase64 = `data:image/png;base64, ${logoText}`;
      // this.organization.logo = logoText ? this.sanitizer.bypassSecurityTrustUrl(logoBase64) : this.defaultAvatar;
    });
  }

  ngAfterViewChecked(): void {
    // Work around for bug in Materialize library, form labels overlap prefilled inputs
    // See https://github.com/InfomediaLtd/angular2-materialize/issues/106
    if (Materialize && Materialize.updateTextFields) {
      Materialize.updateTextFields();
    }
  }

  private getFormConstants(): void {
    this.countries = this.fc.getCountries();
  }

  private initForm(): void {

    this.userForm = this.fb.group({
      'email': ['', []],
      'userName': ['', []],
      'firstName': ['', []],
      'lastName': ['', []],
      'state': ['', []],
      'country': ['', []],
      'phone': ['', []],
      'title': ['', []],
      'introduction': ['', []],
      'linkedinUrl': ['', []],
      'personalUrl': ['', []],
      'githubUrl': ['', []],
      'facebookUrl': ['', []],
      'twitterUrl': ['', []],
      'publishFlag': ['', []],
      'notifyFlag': ['', []]
    });
  }

  private fillForm(): void {

    this.userForm = this.fb.group({
      'email': [this.user.email || '', [Validators.required]],
      'userName': [this.user.userName || '', [Validators.required]],
      'firstName': [this.user.firstName || '', []],
      'lastName': [this.user.lastName || '', []],
      'state': [this.user.state || '', []],
      'country': [this.user.country || '', [Validators.required]],
      'phone': [this.user.phone || '', []],
      'title': [this.user.title || '', []],
      'introduction': [this.user.introduction || '', []],
      'linkedinUrl': [this.user.linkedinUrl || '', []],
      'personalUrl': [this.user.personalUrl || '', []],
      'githubUrl': [this.user.githubUrl || '', []],
      'facebookUrl': [this.user.facebookUrl || '', []],
      'twitterUrl': [this.user.twitterUrl || '', []],
      'publishFlag': [this.user.publishFlag || '', []],
      'notifyFlag': [this.user.notifyFlag || '', []]
    });
  }

  onUploadAvatar(fileInput: any): void {
    this.imageUploader.uploadImage(fileInput,
       this.user.id,
       this.userService.saveAvatar.bind(this.userService))
       .subscribe(res => {
         this.avatar = res.url;
       },
        err => { console.error(err, 'An error occurred'); } );
  }

  private checkRole(userrole: String): void {
    if (this.auth.isOrganization()) {
      this.displayPhone = true;
    }
    if (this.auth.isVolunteer()) {
      this.displayProfile = true;
    }
  }

  private checkFlag(): void {
    if (this.user.publishFlag === 'Y') {
      this.checkPublish = true;
    }
    if (this.user.notifyFlag === 'Y') {
      this.checkNotify = true;
    }
  }

  onSubmit(updatedData: any, event): void {
    event.preventDefault();
    event.stopPropagation();

    this.user.userName = this.userForm.value.userName;
    this.user.firstName = this.userForm.value.firstName;
    this.user.lastName = this.userForm.value.lastName;
    this.user.state = this.userForm.value.state;
    this.user.country = this.userForm.value.country;
    this.user.phone = this.userForm.value.phone;
    this.user.title = this.userForm.value.title;
    this.user.introduction = this.userForm.value.introduction;
    this.user.linkedinUrl = this.userForm.value.linkedinUrl;
    this.user.personalUrl = this.userForm.value.personalUrl;
    this.user.githubUrl = this.userForm.value.githubUrl;
    this.user.facebookUrl = this.userForm.value.facebookUrl;
    this.user.twitterUrl = this.userForm.value.twitterUrl;
    this.user.publishFlag = this.userForm.value.publishFlag;
    this.user.notifyFlag = this.userForm.value.notifyFlag;

    this.userService.update(this.user).subscribe(() => {
        this.globalActions.emit('toast');
       },
        err => { console.error(err, 'An error occurred'); } );
  }

  delete(event): void {
    this.userService.delete(this.user.id)
        .subscribe(
          error => console.log(error)
        );
  }

  openModal(user) {
    this.modalActions.emit({action: 'modal', params: ['open']});
    this.selectedUser = user;
  }

  closeModal() {
    this.modalActions.emit({action: 'modal', params: ['close']});
  }

}

/*
import { Component, ChangeDetectorRef, OnInit, EventEmitter } from '@angular/core';
import { Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { UserService } from '../common/user.service';
import { User } from '../common/user';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterializeAction } from 'angular2-materialize';
import { ImageUploaderService } from '../../_services/image-uploader.service';
import { ImageDisplayService } from '../../_services/image-display.service';
import { FormConstantsService } from '../../_services/form-constants.service';
import { equalValidator } from '../common/user.equal.validator';

export class UserEditComponent implements OnInit {

  public user: User = this.initUser();
  public selectedUser: User;
  public globalActions = new EventEmitter<string|MaterializeAction>();
  public skillsOption = [{value: '1', name: 'CSS'},
    {value: '2', name: 'option2'},
    {value: '3', name: 'python'}];
  public avatar: any = '';
  public states = [{value: 'testState', display: 'testState'}];
  public countries: any[];
  modalActions = new EventEmitter<string|MaterializeAction>();
  public userForm: FormGroup;

  constructor( public fb: FormBuilder,
               private changeDetectorRef: ChangeDetectorRef,
               private route: ActivatedRoute,
               private userService: UserService,
               private fc: FormConstantsService,
               private imageUploader: ImageUploaderService,
               private imageDisplay: ImageDisplayService) { }

  ngOnInit() {
    const id = this.route.snapshot.params['userId'];
    this.getFormConstants();

    this.imageDisplay.displayImage(id,
        this.userService.retrieveAvatar.bind(this.userService))
        .subscribe(res => this.avatar = res.url);

    this.userService.getUser(id)
        .subscribe(
          res => {
            this.user = res;

                this.userForm = this.fb.group({
      'email': [this.user.email || '', [Validators.required]],
      'userName': [this.user.userName || '', [Validators.required]],
      'firstName': [this.user.firstName || '', []],
      'lastName': [this.user.lastName || '', []],
      'state': [this.user.state || '', []],
      'country': [this.user.country || '', [Validators.required]],
      'title': [this.user.title || '', []],
      'introduction': [this.user.introduction || '', []],
      'linkedinUrl': [this.user.linkedinUrl || '', []],
      'personalUrl': [this.user.personalUrl || '', []],
      'facebookUrl': [this.user.facebookUrl || '', []],
      'twitterUrl': [this.user.twitterUrl || '', []],
      'phone': [this.user.phone || '', []],
      'publishFlag': [this.user.publishFlag || '', []],
      'notifyFlag': [this.user.notifyFlag || '', []]
    });
            // this.initForm();
            },
            error => console.log(error)
          );
  }

  fileChange(input) {
    this.image_loaded = false;
    this.readFiles(input.files);
  }

  readFile(file, reader, callback) {

    reader.onload = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(file);

  }

  readFiles(files, index = 0) {

    let reader = new FileReader();
    if (index in files) {

      this.readFile(files[index], reader, (result) => {

        let img = document.createElement('img');

        img.src = result;
        this.resize(img, 250, 250, (resized_jpeg, before, after) => {
          this.debug_size_before = before;
          this.debug_size_after = after;
          this.file_srcs = resized_jpeg;
          this.image_loaded = true;
          this.readFiles(files, index + 1);
        });
      });
    } else {

      this.changeDetectorRef.detectChanges();
    }
  }

  resize(img, MAX_WIDTH: number, MAX_HEIGHT: number, callback) {
    return img.onload = () => {

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      let canvas = document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;
      let ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/jpeg');

      callback(dataUrl, img.src.length, dataUrl.length);

    };
  }

  getImage() {
    if (this.image_loaded) {
      return this.file_srcs;
    } else {
      return ['./assets/default_image.png'];
    }
  }
  */

