import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthStore } from '@kanmind/auth/domain';
import { BoardStore } from '@kanmind/boards/domain';
import { BoardPage } from './board-page';

describe('BoardPage', () => {
  const board = signal({
    id: 7,
    title: 'Migration board',
    ownerId: 42,
    memberCount: 1,
    ticketCount: 2,
    tasksToDoCount: 1,
    highPriorityTaskCount: 1,
    members: [],
    tasks: [
      {
        id: 21,
        boardId: 7,
        title: 'First task',
        description: '',
        status: 'to-do' as const,
        priority: 'medium' as const,
        dueDate: '2099-01-01',
        commentsCount: 0,
        assignee: null,
        reviewer: null,
      },
      {
        id: 22,
        boardId: 7,
        title: 'Second task',
        description: '',
        status: 'done' as const,
        priority: 'low' as const,
        dueDate: '2099-01-02',
        commentsCount: 0,
        assignee: null,
        reviewer: null,
      },
    ],
  });
  const status = signal<'idle' | 'loading' | 'success' | 'error'>('success');
  const deleted = signal(false);
  const store = {
    board,
    status,
    deleted,
    loadBoard: vi.fn(),
    openTask: vi.fn(),
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    vi.clearAllMocks();
    board.set({ ...board(), id: 7 });
    status.set('success');
    deleted.set(false);

    TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        { provide: AuthStore, useValue: {} },
        { provide: Router, useValue: router },
      ],
    });
    TestBed.overrideComponent(BoardPage, {
      set: {
        template: '',
        providers: [{ provide: BoardStore, useValue: store }],
      },
    });
  });

  it('loads the requested board again when the route input changes', () => {
    const fixture = TestBed.createComponent(BoardPage);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    TestBed.tick();

    fixture.componentRef.setInput('id', '8');
    fixture.detectChanges();
    TestBed.tick();

    expect(store.loadBoard).toHaveBeenNthCalledWith(1, 7);
    expect(store.loadBoard).toHaveBeenNthCalledWith(2, 8);
  });

  it('opens valid task route inputs once and reacts to a changed task input', () => {
    const fixture = TestBed.createComponent(BoardPage);
    fixture.componentRef.setInput('id', '7');
    fixture.componentRef.setInput('task_id', '21');
    fixture.detectChanges();
    TestBed.tick();

    fixture.componentRef.setInput('task_id', '22');
    fixture.detectChanges();
    TestBed.tick();

    expect(store.openTask).toHaveBeenNthCalledWith(1, 21);
    expect(store.openTask).toHaveBeenNthCalledWith(2, 22);
  });

  it('redirects invalid board route inputs to the boards list', () => {
    const fixture = TestBed.createComponent(BoardPage);
    fixture.componentRef.setInput('id', 'invalid');
    fixture.detectChanges();
    TestBed.tick();

    expect(store.loadBoard).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/boards']);
  });

  it('redirects after the board is deleted', () => {
    const fixture = TestBed.createComponent(BoardPage);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    TestBed.tick();

    deleted.set(true);
    TestBed.tick();

    expect(router.navigate).toHaveBeenCalledWith(['/boards']);
  });
});
