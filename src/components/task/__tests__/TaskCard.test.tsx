import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { TaskCard } from '../TaskCard';
import { Task } from '../../../types/task';
import * as dateHelpers from '../../../utils/dateHelpers';

// Mock date helpers
jest.mock('../../../utils/dateHelpers', () => ({
  toDate: jest.fn().mockImplementation((date) => {
    if (!date) return null;
    if (date instanceof Date) return date;
    return new Date(date);
  }),
}));

// Mock date-fns functions
jest.mock('date-fns', () => ({
  isPast: jest.fn().mockImplementation((date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  }),
  isToday: jest.fn().mockImplementation((date) => {
    if (!date) return false;
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  }),
  isTomorrow: jest.fn().mockImplementation((date) => {
    if (!date) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = new Date(date);
    return checkDate.toDateString() === tomorrow.toDateString();
  }),
  differenceInDays: jest.fn().mockImplementation((date1, date2) => {
    if (!date1 || !date2) return 0;
    const diffTime = new Date(date1) - new Date(date2);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }),
  format: jest.fn().mockImplementation((date, formatStr) => {
    if (!date) return '';
    return '2024-01-01';
  }),
}));

const mockToDate = dateHelpers.toDate as jest.MockedFunction<typeof dateHelpers.toDate>;

// Mock task data
const mockTask: Task = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'pending',
  priority: 'medium',
  category: 'work',
  assigneeId: 'user-1',
  groupId: 'group-1',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  dueDate: new Date('2024-01-02T10:00:00Z'),
  tags: ['urgent', 'important'],
  watchers: [],
  mentionedUsers: [],
  attachments: [],
  reminders: [],
  completedAt: null,
  completedBy: null,
  completionNotes: null,
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: 'completed-task-1',
  title: 'Completed Task',
  status: 'completed',
  completedAt: new Date('2024-01-01T15:00:00Z'),
  completedBy: 'user-1',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TaskCard', () => {
  const mockOnToggleComplete = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockToDate.mockImplementation((date) => {
      if (date instanceof Date) return date;
      return new Date(date);
    });
  });

  describe('기본 렌더링', () => {
    it('할일 정보를 올바르게 표시해야 한다', () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('This is a test task description')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
    });

    it('완료된 할일은 완료 표시가 되어야 한다', () => {
      renderWithRouter(
        <TaskCard
          task={mockCompletedTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Completed Task')).toBeInTheDocument();
      // Completed task should have different visual appearance
      const taskElement = screen.getByText('Completed Task').closest('.task-card');
      expect(taskElement).toHaveClass('completed'); // Assuming completed tasks have a 'completed' class
    });

    it('우선순위에 따라 적절한 스타일이 적용되어야 한다', () => {
      const highPriorityTask = { ...mockTask, priority: 'high' as const };
      renderWithRouter(
        <TaskCard
          task={highPriorityTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // High priority tasks should have priority indicator
      const priorityElement = screen.getByTestId('priority-indicator') || 
                             screen.getByText('높음') || 
                             document.querySelector('[data-priority=\"high\"]');
      expect(priorityElement).toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('완료 토글 버튼을 클릭하면 onToggleComplete가 호출되어야 한다', async () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /완료/i }) || 
                          screen.getByLabelText(/할일 완료/i) ||
                          screen.getByTestId('toggle-complete-button');
      
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(mockOnToggleComplete).toHaveBeenCalledWith(mockTask.id);
      });
    });

    it('수정 버튼을 클릭하면 onEdit가 호출되어야 한다', async () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /수정/i }) || 
                        screen.getByLabelText(/수정/i) ||
                        screen.getByTestId('edit-button');
      
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
      });
    });

    it('삭제 버튼을 클릭하면 onDelete가 호출되어야 한다', async () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /삭제/i }) || 
                          screen.getByLabelText(/삭제/i) ||
                          screen.getByTestId('delete-button');
      
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
      });
    });
  });

  describe('날짜 표시', () => {
    it('마감일이 있는 경우 마감일을 표시해야 한다', () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Should show due date information
      const dateElement = screen.getByText(/1월 2일/i) || 
                          screen.getByText(/2024-01-02/i) ||
                          screen.getByTestId('due-date');
      expect(dateElement).toBeInTheDocument();
    });

    it('마감일이 없는 경우 마감일을 표시하지 않아야 한다', () => {
      const taskWithoutDueDate = { ...mockTask, dueDate: null };
      renderWithRouter(
        <TaskCard
          task={taskWithoutDueDate}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Should not show due date when not available
      expect(screen.queryByTestId('due-date')).not.toBeInTheDocument();
    });
  });

  describe('태그 표시', () => {
    it('태그가 있는 경우 모든 태그를 표시해야 한다', () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
    });

    it('태그가 없는 경우 태그 섹션을 표시하지 않아야 한다', () => {
      const taskWithoutTags = { ...mockTask, tags: [] };
      renderWithRouter(
        <TaskCard
          task={taskWithoutTags}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const tagContainer = screen.queryByTestId('task-tags');
      if (tagContainer) {
        expect(tagContainer.children).toHaveLength(0);
      }
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 레이블이 있어야 한다', () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Task should have appropriate aria labels
      const taskElement = screen.getByRole('article') || 
                          screen.getByLabelText(/할일/i) ||
                          document.querySelector('[aria-label*="할일"]');
      expect(taskElement).toBeInTheDocument();
    });

    it('키보드 네비게이션이 가능해야 한다', () => {
      renderWithRouter(
        <TaskCard
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });
  });
});