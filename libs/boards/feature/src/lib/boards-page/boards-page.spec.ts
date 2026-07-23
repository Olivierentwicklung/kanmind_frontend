import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '@kanmind/auth/domain';
import { BoardsStore } from '@kanmind/boards/domain';
import { BoardsPage } from './boards-page';

describe('BoardsPage', () => {
  const store = { loadBoards: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [BoardsPage],
      providers: [
        { provide: AuthStore, useValue: {} },
        { provide: Router, useValue: router },
      ],
    });
    TestBed.overrideComponent(BoardsPage, {
      set: {
        template: '',
        providers: [{ provide: BoardsStore, useValue: store }],
      },
    });
  });

  it('loads boards when initialized', () => {
    const fixture = TestBed.createComponent(BoardsPage);
    fixture.detectChanges();

    expect(store.loadBoards).toHaveBeenCalledOnce();
  });

  it('navigates to the selected board', () => {
    const fixture = TestBed.createComponent(BoardsPage);
    fixture.detectChanges();

    fixture.componentInstance.openBoard(7);

    expect(router.navigate).toHaveBeenCalledWith(['/board'], {
      queryParams: { id: 7 },
    });
  });
});
