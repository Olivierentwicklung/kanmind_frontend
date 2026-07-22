import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalPageShell } from './legal-page-shell';

@Component({
  selector: 'lib-imprint-page',
  imports: [LegalPageShell],
  template: `<lib-legal-page-shell title="Imprint"><section class="d_flex_ss_gm f_d_c"><h2>Legal Notice</h2><address><p><strong>Name:</strong> Max Mustermann</p><p><strong>Address:</strong> Sample Street 1, 12345 Sample City</p><p><strong>Phone:</strong> <a class="link_secondary" href="tel:+44123456789">+44 123 456 789</a></p><p><strong>Email:</strong> <a class="link_secondary" href="mailto:info@example.com">info@example.com</a></p></address></section><section class="d_flex_ss_gm f_d_c"><h3>Disclaimer</h3><p>Despite careful content control, we assume no liability for the content of external links. The operators of the linked pages are solely responsible for their content.</p></section></lib-legal-page-shell>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImprintPage {}
