import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular/zoneless';
import { ImprintPage } from './imprint-page';
import { PrivacyPage } from './privacy-page';

describe('legal pages', () => {
  it('renders the privacy policy content and navigation', async () => {
    await render(PrivacyPage, { providers: [provideHttpClient(), provideRouter([])] });

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Imprint' }).getAttribute('href')).toBe('/imprint');
  });

  it('renders the legal notice contact details', async () => {
    await render(ImprintPage, { providers: [provideHttpClient(), provideRouter([])] });

    expect(screen.getByText('Max Mustermann')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'info@example.com' }).getAttribute('href')).toBe('mailto:info@example.com');
  });
});
import { provideHttpClient } from '@angular/common/http';
