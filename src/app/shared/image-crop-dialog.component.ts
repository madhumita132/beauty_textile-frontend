import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

export interface ImageCropDialogData {
  file: File;
  /** Fixed width/height ratio to crop to (e.g. 1 for square, 3/4 for portrait). Omit for freeform. */
  aspectRatio?: number;
}

/**
 * Crop dialog shown before any image upload (hero slide, category,
 * product, variant, extra images). When `aspectRatio` is provided the crop box
 * is locked to that ratio so the result matches how the image is actually
 * displayed elsewhere in the app; otherwise the admin can resize freely.
 * Confirms with a cropped JPEG `File`, or closes with `null` if cancelled.
 */
@Component({
  selector: 'app-image-crop-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ImageCropperComponent],
  template: `
    <h2 mat-dialog-title>Crop image</h2>
    <mat-dialog-content class="crop-content">
      <image-cropper
        [imageFile]="data.file"
        [maintainAspectRatio]="!!data.aspectRatio"
        [aspectRatio]="data.aspectRatio || 1"
        format="jpeg"
        output="blob"
        [imageQuality]="90"
        (imageCropped)="onCropped($event)">
      </image-cropper>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!croppedBlob" (click)="confirm()">
        <mat-icon>check</mat-icon> Use Photo
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .crop-content { max-height: 68vh; min-width: 0; width: 100%; box-sizing: border-box; }
    image-cropper { max-height: 65vh; width: 100%; display: block; }

    @media (max-width: 480px) {
      .crop-content { max-height: 60vh; }
      image-cropper { max-height: 55vh; }
      mat-dialog-actions { flex-direction: column-reverse; gap: 8px; }
      mat-dialog-actions button { width: 100%; margin: 0 !important; }
    }
  `]
})
export class ImageCropDialogComponent {
  croppedBlob: Blob | null = null;

  constructor(
    public dialogRef: MatDialogRef<ImageCropDialogComponent, File | null>,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropDialogData
  ) {}

  onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
  }

  confirm(): void {
    if (!this.croppedBlob) return;
    const name = this.data.file.name.replace(/\.[^.]+$/, '') + '.jpg';
    this.dialogRef.close(new File([this.croppedBlob], name, { type: 'image/jpeg' }));
  }
}
