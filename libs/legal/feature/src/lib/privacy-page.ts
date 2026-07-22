import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LegalPageShell } from './legal-page-shell';

@Component({
  selector: 'lib-privacy-page',
  imports: [LegalPageShell],
  template: `<lib-legal-page-shell title="Privacy Policy"><section class="d_flex_ss_gm f_d_c"><h2>Subtitle</h2><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iste ea placeat illo omnis, atque temporibus nostrum quia! Impedit, aliquid. Placeat impedit neque quod quasi eos fuga ipsa fugit odit voluptatem?</p></section></lib-legal-page-shell>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPage {}
