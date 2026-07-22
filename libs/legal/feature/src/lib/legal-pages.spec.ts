import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ImprintPage } from './imprint-page';
import { PrivacyPage } from './privacy-page';

describe('legal pages', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PrivacyPage, ImprintPage], providers: [provideRouter([])] }).compileComponents();
  });

  it('renders the privacy policy content and navigation', () => {
    const fixture = TestBed.createComponent(PrivacyPage); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Privacy Policy');
    expect(element.querySelector('a[href="/imprint"]')).toBeTruthy();
  });

  it('renders the legal notice contact details', () => {
    const fixture = TestBed.createComponent(ImprintPage); fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Max Mustermann');
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="mailto:info@example.com"]')).toBeTruthy();
  });
});
