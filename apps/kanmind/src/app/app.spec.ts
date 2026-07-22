import { provideRouter } from '@angular/router';
import { render } from '@testing-library/angular/zoneless';
import { App } from './app';

describe('App', () => {
  it('hosts the router outlet', async () => {
    const { container } = await render(App, { providers: [provideRouter([])] });

    expect(container.querySelector('router-outlet')).toBeTruthy();
  });
});
