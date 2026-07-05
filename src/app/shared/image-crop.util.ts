import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ImageCropDialogComponent } from './image-crop-dialog.component';

/**
 * Safe upload ceiling for the *cropped* output (the backend accepts up to 10 MB).
 * We don't gate on the original file size — modern phone camera photos are
 * routinely 8-15 MB, but cropping + JPEG re-encoding shrinks them well below this.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Opens the crop dialog for the given file and resolves with the cropped
 * `File`, or `null` if the admin cancels the dialog.
 *
 * @param aspectRatio Fixed width/height ratio to lock the crop box to (e.g.
 * `1` for square, `3/4` for portrait). Omit to allow a freeform crop.
 */
export function openImageCropDialog(dialog: MatDialog, file: File, aspectRatio?: number): Promise<File | null> {
  const ref = dialog.open(ImageCropDialogComponent, {
    data: { file, aspectRatio },
    width: '95vw',
    maxWidth: '640px',
    maxHeight: '92vh',
    autoFocus: false
  });
  return firstValueFrom(ref.afterClosed()).then(result => result ?? null);
}
