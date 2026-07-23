import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '@kanmind/auth/domain';
import { DashboardStore } from '@kanmind/dashboard/domain';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  const session = signal({
    token: 'token',
    userId: 42,
    email: 'ada@example.com',
    fullName: 'Ada Lovelace',
  });
  const store = {
    loadDashboard: vi.fn(),
    selectTaskMode: vi.fn(),
  };
  const authStore = { session };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    vi.clearAllMocks();
    session.set({
      token: 'token',
      userId: 42,
      email: 'ada@example.com',
      fullName: 'Ada Lovelace',
    });

    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    });
    TestBed.overrideComponent(DashboardPage, {
      set: {
        template: '',
        providers: [{ provide: DashboardStore, useValue: store }],
      },
    });
  });

  it('loads dashboard state from the authenticated session', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    expect(store.loadDashboard).toHaveBeenCalledWith({
      userId: 42,
      fullName: 'Ada Lovelace',
    });
  });

  it('forwards task mode intent and navigates to selected entities', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    fixture.componentInstance.selectTaskMode('reviewing');
    fixture.componentInstance.openBoard(7);
    fixture.componentInstance.openTask({ boardId: 7, taskId: 21 });
    fixture.componentInstance.openBoards();

    expect(store.selectTaskMode).toHaveBeenCalledWith('reviewing');
    expect(router.navigate).toHaveBeenNthCalledWith(1, ['/board'], {
      queryParams: { id: 7 },
    });
    expect(router.navigate).toHaveBeenNthCalledWith(2, ['/board'], {
      queryParams: { id: 7, task_id: 21 },
    });
    expect(router.navigate).toHaveBeenNthCalledWith(3, ['/boards']);
  });
});
