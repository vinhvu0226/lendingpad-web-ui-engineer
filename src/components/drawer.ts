export function drawerTemplate(): string {
  return `
    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <aside class="drawer" id="edit-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer__panels-track" id="drawer-panels-track">

        <div class="drawer__panel">
          <header class="drawer__header">
            <h2 class="drawer__title" id="drawer-title">Edit Record</h2>
            <button class="drawer__close" id="drawer-close" aria-label="Close drawer">&times;</button>
          </header>
          <div class="drawer__body">
            <div class="drawer__skeleton" id="drawer-skeleton" hidden aria-hidden="true">
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
              <div class="skel-field"><div class="skel-label"></div><div class="skel-input"></div></div>
            </div>
            <form class="edit-form" id="drawer-form" novalidate>
              <div class="form-field">
                <label class="form-field__label" for="drawer-full-name">
                  Full Name <span class="form-field__required" aria-label="required">*</span>
                </label>
                <input type="text" id="drawer-full-name" name="fullName" class="form-field__input"
                  autocomplete="name" required placeholder="Enter full name">
              </div>
              <div class="form-field">
                <label class="form-field__label" for="drawer-email">
                  Email Address <span class="form-field__required" aria-label="required">*</span>
                </label>
                <input type="email" id="drawer-email" name="email" class="form-field__input"
                  autocomplete="email" required placeholder="name@example.com">
              </div>
              <div class="form-field">
                <label class="form-field__label" for="drawer-phone">Phone Number</label>
                <input type="tel" id="drawer-phone" name="phone" class="form-field__input"
                  autocomplete="tel" placeholder="+1 (555) 000-0000">
              </div>
              <div class="form-field form-field--readonly">
                <label class="form-field__label" for="drawer-account-id">Account ID</label>
                <input type="text" id="drawer-account-id" class="form-field__input" readonly>
                <span class="form-field__hint">System-generated — cannot be edited.</span>
              </div>
              <div class="form-field">
                <label class="form-field__label" for="drawer-status">Account Status</label>
                <select id="drawer-status" name="status" class="form-field__select">
                  <option value="open">Open</option>
                  <option value="paid">Paid</option>
                  <option value="due">Due</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-field__label" for="drawer-rate">Monthly Rate (CAD)</label>
                <input type="number" id="drawer-rate" name="rate" class="form-field__input"
                  min="0" step="0.01" placeholder="0.00">
              </div>
              <div class="form-field">
                <label class="form-field__label" for="drawer-balance">Current Balance (CAD)</label>
                <input type="number" id="drawer-balance" name="balance" class="form-field__input"
                  step="0.01" placeholder="0.00">
                <span class="form-field__hint">Negative = amount still owed.</span>
              </div>
              <div class="form-field">
                <label class="form-field__label" for="drawer-deposit">Deposit Amount (CAD)</label>
                <input type="number" id="drawer-deposit" name="deposit" class="form-field__input"
                  min="0" step="0.01" placeholder="0.00">
              </div>
            </form>
          </div>
          <footer class="drawer__footer">
            <button type="button" class="btn btn--secondary" id="drawer-cancel">Cancel</button>
            <button type="button" class="btn btn--primary" id="drawer-confirm">Confirm</button>
          </footer>
        </div>

        <div class="drawer__panel">
          <header class="drawer__header">
            <h2 class="drawer__title">Confirm Changes</h2>
            <button class="drawer__close" id="drawer-close-2" aria-label="Close drawer">&times;</button>
          </header>
          <div class="drawer__body">
            <div class="diff-view" id="drawer-diff"></div>
          </div>
          <footer class="drawer__footer">
            <button type="button" class="btn btn--secondary" id="drawer-back">&#8592; Back</button>
            <button type="button" class="btn btn--primary" id="drawer-save">Save</button>
          </footer>
        </div>

      </div>
    </aside>`
}
