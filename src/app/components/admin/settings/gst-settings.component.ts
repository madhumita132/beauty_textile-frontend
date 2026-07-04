import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AppSettingsService } from '../../../services/app-settings.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { AppSettings, AdminUser } from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-gst-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DecimalPipe,
    MatIconModule, MatButtonModule, MatSlideToggleModule,
    MatSelectModule, MatFormFieldModule
  ],
  template: `
    <h1 class="page-title">Shop Settings</h1>

    <!-- Tab bar -->
    <div class="tabs">
      <button [class.active]="tab==='gst'"    (click)="tab='gst'">GST</button>
      <button [class.active]="tab==='users'"  (click)="tab='users'; loadUsers()">Users</button>
      <button [class.active]="tab==='backup'" (click)="tab='backup'">Backup</button>
    </div>

    <!-- ═══ GST TAB ═══ -->
    @if (tab === 'gst') {
    <div class="settings-grid">

      <!-- GST Card -->
      <div class="settings-card">
        <div class="card-header">
          <mat-icon>receipt_long</mat-icon>
          <h2>GST Configuration</h2>
        </div>
        <p class="card-desc">
          GST is applied to the <strong>entire bill</strong> after any discounts.
          One GST percentage applies to all products — no product-wise or category-wise GST.
        </p>

        @if (settings) {
          <div class="form-section">
            <div class="toggle-row">
              <div>
                <div class="field-label">GST Enabled</div>
                <div class="field-hint">Turn on to apply GST on every bill</div>
              </div>
              <mat-slide-toggle
                [(ngModel)]="settings.gstEnabled"
                color="primary">
              </mat-slide-toggle>
            </div>

            <div class="form-group" [class.disabled]="!settings.gstEnabled">
              <label class="field-label">GST Percentage</label>
              <div class="field-hint">Applicable GST rate</div>
              <mat-form-field appearance="outline" class="gst-select">
                <mat-select [(ngModel)]="settings.gstPercentage" [disabled]="!settings.gstEnabled">
                  @for (opt of gstOptions; track opt) {
                    <mat-option [value]="opt">{{ opt }}%</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Live Preview -->
            @if (settings.gstEnabled && settings.gstPercentage > 0) {
              <div class="preview-box">
                <div class="preview-title">Bill Preview (Example: ₹1,000 subtotal)</div>
                <div class="preview-row">
                  <span>Sub Total</span>
                  <span>₹1,000</span>
                </div>
                <div class="preview-row gst-row">
                  <span>GST {{ settings.gstPercentage }}%</span>
                  <span>₹{{ 1000 * settings.gstPercentage / 100 | number:'1.0-0' }}</span>
                </div>
                <div class="preview-divider"></div>
                <div class="preview-row total-row">
                  <span>Total</span>
                  <span>₹{{ 1000 + (1000 * settings.gstPercentage / 100) | number:'1.0-0' }}</span>
                </div>
              </div>
            }

            @if (!settings.gstEnabled) {
              <div class="preview-box disabled-preview">
                <div class="preview-title">GST is currently OFF</div>
                <div class="preview-row">
                  <span>Sub Total</span>
                  <span>₹1,000</span>
                </div>
                <div class="preview-divider"></div>
                <div class="preview-row total-row">
                  <span>Total</span>
                  <span>₹1,000</span>
                </div>
              </div>
            }

            <button class="btn btn-primary btn-save" [disabled]="saving" (click)="save()">
              <mat-icon>save</mat-icon>
              {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        } @else {
          <div class="loading-text">Loading settings…</div>
        }
      </div>

      <!-- Info card -->
      <div class="settings-card info-card">
        <div class="card-header">
          <mat-icon>info</mat-icon>
          <h2>How GST Works</h2>
        </div>
        <ul class="info-list">
          <li><mat-icon class="info-icon">check_circle</mat-icon> GST is applied on the <strong>entire bill</strong></li>
          <li><mat-icon class="info-icon">check_circle</mat-icon> Applied <strong>after</strong> any bill-level discounts</li>
          <li><mat-icon class="info-icon">check_circle</mat-icon> GST % is snapshotted on the bill at billing time</li>
          <li><mat-icon class="info-icon">check_circle</mat-icon> Changing settings won't affect past bills</li>
          <li><mat-icon class="info-icon">cancel</mat-icon> No product-wise or category-wise GST</li>
        </ul>

        <div class="gst-rates">
          <div class="rates-title">Supported GST Rates</div>
          @for (opt of gstOptions; track opt) {
            <span class="rate-chip">{{ opt }}%</span>
          }
        </div>
      </div>

    </div>
    } <!-- /gst tab -->

    <!-- ═══ USERS TAB ═══ -->
    @if (tab === 'users') {
    <div class="settings-card" style="max-width:680px">
      <div class="card-header">
        <mat-icon>manage_accounts</mat-icon>
        <h2>User Management</h2>
      </div>
      <p class="card-desc">
        <strong>ADMIN</strong> — full access to all modules.<br>
        <strong>BILLING</strong> — can only access Billing/POS.
      </p>

      <table class="user-table">
        <thead><tr><th>#</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          @for (u of users; track u.id) {
            <tr>
              <td>{{ u.id }}</td>
              <td>{{ u.username }}</td>
              <td><span [class]="'role-chip role-' + u.role.toLowerCase()">{{ u.role }}</span></td>
              <td>
                <button class="btn-sm btn-danger" (click)="deleteUser(u)">Delete</button>
              </td>
            </tr>
          }
        </tbody>
      </table>

      <div class="new-user-form">
        <h3>Add New User</h3>
        <div class="form-row-r">
          <input [(ngModel)]="newUser.username" class="form-ctrl" placeholder="Username" />
          <input [(ngModel)]="newUser.password" type="password" class="form-ctrl" placeholder="Password" />
          <select [(ngModel)]="newUser.role" class="form-ctrl">
            <option value="ADMIN">ADMIN</option>
            <option value="BILLING">BILLING</option>
          </select>
          <button class="btn btn-primary" [disabled]="savingUser || !newUser.username || !newUser.password"
            (click)="addUser()">
            {{ savingUser ? '...' : 'Add User' }}
          </button>
        </div>
      </div>
    </div>
    } <!-- /users tab -->

    <!-- ═══ BACKUP TAB ═══ -->
    @if (tab === 'backup') {
    <div class="settings-card" style="max-width:560px">
      <div class="card-header">
        <mat-icon>backup</mat-icon>
        <h2>Database Backup</h2>
      </div>
      <p class="card-desc">
        Download a complete MySQL dump of the beauty_textile database.
        The backup includes all tables — products, orders, billing, reviews, settings.
      </p>
      <div class="backup-info">
        <mat-icon class="bi">info</mat-icon>
        <span>mysqldump must be installed on the server (comes with MySQL installation).</span>
      </div>
      <a class="btn btn-primary backup-btn" [href]="backupUrl" download>
        <mat-icon>download</mat-icon>
        Download Backup (backup.sql)
      </a>
    </div>
    } <!-- /backup tab -->
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; }
    .tabs { display:flex; gap:8px; margin-bottom:24px; }
    .tabs button { padding:8px 20px; border-radius:20px; border:1px solid #ddd; background:#fff; font-size:.88rem; cursor:pointer; }
    .tabs button.active { background:#805500; color:#fff; border-color:#805500; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
    @media (max-width: 800px) { .settings-grid { grid-template-columns: 1fr; } }

    .settings-card {
      background: #fff; border-radius: 12px;
      padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,.06);
    }
    .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .card-header mat-icon { color: #805500; font-size: 22px; }
    .card-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .card-desc { font-size: .85rem; color: #666; margin-bottom: 24px; line-height: 1.5; }

    .toggle-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 20px;
    }
    .field-label { font-weight: 600; font-size: .9rem; margin-bottom: 2px; }
    .field-hint { font-size: .78rem; color: #999; }

    .form-group { margin-bottom: 20px; }
    .form-group.disabled { opacity: .45; pointer-events: none; }
    .gst-select { width: 100%; margin-top: 8px; }

    .preview-box {
      background: #fef9f0; border: 1px solid #f5e6c8;
      border-radius: 8px; padding: 16px; margin: 16px 0; font-size: .9rem;
    }
    .disabled-preview { background: #f9f9f9; border-color: #e0e0e0; }
    .preview-title { font-weight: 700; font-size: .8rem; color: #805500; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .preview-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .gst-row { color: #c0392b; font-weight: 600; }
    .total-row { font-weight: 700; font-size: 1rem; }
    .preview-divider { border-top: 1px dashed #ccc; margin: 8px 0; }

    .btn-save {
      width: 100%; padding: 12px; font-size: .95rem;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .loading-text { color: #aaa; padding: 24px 0; text-align: center; }

    .info-card { background: #fafafa; }
    .info-list { list-style: none; padding: 0; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
    .info-list li { display: flex; align-items: center; gap: 8px; font-size: .88rem; }
    .info-icon { font-size: 16px !important; width: 16px; height: 16px; color: #27ae60; }
    .info-list li:nth-last-child(1) .info-icon { color: #c0392b; }

    .gst-rates { margin-top: 20px; }
    .rates-title { font-size: .8rem; font-weight: 700; color: #666; margin-bottom: 10px; }
    .rate-chip {
      display: inline-block; background: #fff3cd; color: #805500;
      border: 1px solid #f5c842; border-radius: 20px;
      padding: 3px 12px; font-size: .8rem; font-weight: 600; margin: 3px;
    }
    /* Users tab */
    .user-table { width:100%; border-collapse:collapse; margin-bottom:24px; font-size:.88rem; }
    .user-table th { text-align:left; padding:8px 10px; border-bottom:2px solid #f0f0f0; color:#666; }
    .user-table td { padding:8px 10px; border-bottom:1px solid #f8f8f8; }
    .role-chip { padding:2px 10px; border-radius:12px; font-size:.78rem; font-weight:700; }
    .role-admin   { background:#fdecea; color:#c0392b; }
    .role-billing { background:#e8f4fd; color:#2471a3; }
    .btn-sm { padding:4px 10px; font-size:.78rem; border-radius:6px; cursor:pointer; border:none; }
    .btn-danger { background:#e74c3c; color:#fff; }
    .new-user-form h3 { font-size:.95rem; font-weight:700; margin-bottom:12px; }
    .form-row-r { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .form-ctrl { padding:8px 10px; border:1px solid #ddd; border-radius:6px; font-size:.88rem; }
    /* Backup tab */
    .backup-info { display:flex; align-items:center; gap:8px; background:#e8f4fd; padding:12px; border-radius:8px; margin-bottom:20px; font-size:.85rem; color:#333; }
    .bi { color:#2471a3; }
    .backup-btn { display:flex; align-items:center; gap:8px; text-decoration:none; padding:12px 20px; border-radius:8px; font-size:.95rem; width:fit-content; }
  `]
})
export class GstSettingsComponent implements OnInit {
  settings: AppSettings | null = null;
  saving = false;
  readonly gstOptions = [0, 1, 2, 3, 5, 12, 18];
  tab: 'gst' | 'users' | 'backup' = 'gst';
  users: AdminUser[] = [];
  savingUser = false;
  newUser = { username: '', password: '', role: 'BILLING' };
  readonly backupUrl = `${environment.apiUrl}/admin/backup`;

  constructor(
    private settingsSvc: AppSettingsService,
    private authSvc: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.settingsSvc.getGstSettings().subscribe({
      next: s => { this.settings = { ...s }; this.cdr.markForCheck(); },
      error: () => this.toast.error('Failed to load settings')
    });
  }

  save(): void {
    if (!this.settings) return;
    this.saving = true;
    this.settingsSvc.updateGstSettings({
      gstEnabled:    this.settings.gstEnabled,
      gstPercentage: this.settings.gstPercentage
    }).subscribe({
      next: s => {
        this.settings = { ...s };
        this.saving = false;
        this.cdr.markForCheck();
        this.toast.success('GST settings saved ✓');
      },
      error: () => {
        this.saving = false;
        this.cdr.markForCheck();
        this.toast.error('Failed to save settings');
      }
    });
  }

  loadUsers(): void {
    this.authSvc.listUsers().subscribe({
      next: u => { this.users = u; this.cdr.markForCheck(); },
      error: () => this.toast.error('Failed to load users')
    });
  }

  addUser(): void {
    if (!this.newUser.username || !this.newUser.password) return;
    this.savingUser = true;
    this.authSvc.createUser(this.newUser.username, this.newUser.password, this.newUser.role).subscribe({
      next: u => {
        this.users = [...this.users, u];
        this.newUser = { username: '', password: '', role: 'BILLING' };
        this.savingUser = false;
        this.cdr.markForCheck();
        this.toast.success(`User "${u.username}" created`);
      },
      error: err => {
        this.savingUser = false;
        this.cdr.markForCheck();
        this.toast.error(err.error?.message || 'Failed to create user');
      }
    });
  }

  deleteUser(u: AdminUser): void {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    this.authSvc.deleteUser(u.id).subscribe({
      next: () => {
        this.users = this.users.filter(x => x.id !== u.id);
        this.cdr.markForCheck();
        this.toast.success(`User "${u.username}" deleted`);
      },
      error: () => this.toast.error('Failed to delete user')
    });
  }
}
