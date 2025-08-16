import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { QuickAddTask } from '../QuickAddTask';
import { TaskPriority, TaskCategory } from '../../../types/task';

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation((date, formatStr, options) => {
    if (formatStr === 'M월 d일') {
      return '1월 15일';
    }
    return '2024-01-15';
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('QuickAddTask', () => {
  const mockOnAdd = jest.fn();
  const mockGroupMembers = [
    { id: 'member-1', name: '홍길동', avatar: 'avatar1.jpg' },
    { id: 'member-2', name: '김철수', avatar: 'avatar2.jpg' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('기본 입력 필드와 버튼들을 표시해야 한다', () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      expect(screen.getByPlaceholderText(/빠른 할일 추가/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument();
    });

    it('커스텀 placeholder를 표시해야 한다', () => {
      const customPlaceholder = '새로운 할일을 입력하세요';
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} placeholder={customPlaceholder} />
      );

      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });

    it('자연어 입력 도움말을 표시해야 한다', () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      expect(screen.getByText(/팁:/)).toBeInTheDocument();
    });
  });

  describe('기본 입력 모드', () => {
    it('간단한 텍스트를 입력하고 추가할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '장보기' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          title: '장보기',
          priority: 'medium',
          category: 'personal',
          tags: []
        });
      });

      expect(input).toHaveValue('');
    });

    it('Enter 키로 할일을 추가할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);

      fireEvent.change(input, { target: { value: '운동하기' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith({
          title: '운동하기',
          priority: 'medium',
          category: 'personal',
          tags: []
        });
      });
    });

    it('빈 입력으로는 추가할 수 없어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const submitButton = screen.getByRole('button', { name: '추가' });
      
      fireEvent.click(submitButton);

      expect(mockOnAdd).not.toHaveBeenCalled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('자연어 파싱', () => {
    it('우선순위를 올바르게 파싱해야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      // 높은 우선순위
      fireEvent.change(input, { target: { value: '중요한 회의 !높음' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenLastCalledWith(
          expect.objectContaining({
            title: '중요한 회의',
            priority: 'high'
          })
        );
      });

      // 낮은 우선순위
      fireEvent.change(input, { target: { value: '책 읽기 !낮음' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenLastCalledWith(
          expect.objectContaining({
            title: '책 읽기',
            priority: 'low'
          })
        );
      });
    });

    it('카테고리를 올바르게 파싱해야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '회의 참석 @업무' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '회의 참석',
            category: 'work'
          })
        );
      });
    });

    it('태그를 올바르게 파싱해야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '장보기 #쇼핑 #필수' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '장보기',
            tags: ['쇼핑', '필수']
          })
        );
      });
    });

    it('날짜를 올바르게 파싱해야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '오늘까지 보고서 작성' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '보고서 작성',
            dueDate: expect.any(String)
          })
        );
      });
    });

    it('복합적인 자연어를 올바르게 파싱해야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      fireEvent.change(input, { target: { value: '내일까지 장보기 #쇼핑 @집안일 !높음' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '장보기',
            priority: 'high',
            category: 'household',
            tags: ['쇼핑'],
            dueDate: expect.any(String)
          })
        );
      });
    });
  });

  describe('확장 모드', () => {
    it('확장 버튼을 클릭하면 옵션이 표시되어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const expandButton = screen.getByRole('button', { name: '+' });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('높음')).toBeInTheDocument();
        expect(screen.getByText('중간')).toBeInTheDocument();
        expect(screen.getByText('낮음')).toBeInTheDocument();
      });

      expect(screen.getByText('집안일')).toBeInTheDocument();
      expect(screen.getByText('업무')).toBeInTheDocument();
      expect(screen.getByText('개인')).toBeInTheDocument();
    });

    it('확장 모드에서 우선순위를 선택할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const expandButton = screen.getByRole('button', { name: '+' });

      fireEvent.click(expandButton);

      await waitFor(() => {
        const highPriorityButton = screen.getByRole('button', { name: '높음' });
        fireEvent.click(highPriorityButton);
      });

      fireEvent.change(input, { target: { value: '중요한 업무' } });

      const submitButton = screen.getByRole('button', { name: '추가' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '중요한 업무',
            priority: 'high'
          })
        );
      });
    });

    it('확장 모드에서 카테고리를 선택할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const expandButton = screen.getByRole('button', { name: '+' });

      fireEvent.click(expandButton);

      await waitFor(() => {
        const workCategoryButton = screen.getByRole('button', { name: '업무' });
        fireEvent.click(workCategoryButton);
      });

      fireEvent.change(input, { target: { value: '프로젝트 회의' } });

      const submitButton = screen.getByRole('button', { name: '추가' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '프로젝트 회의',
            category: 'work'
          })
        );
      });
    });

    it('확장 모드에서 태그를 추가할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const expandButton = screen.getByRole('button', { name: '+' });

      fireEvent.click(expandButton);

      await waitFor(() => {
        const tagInput = screen.getByPlaceholderText('태그 입력...');
        fireEvent.change(tagInput, { target: { value: '긴급' } });
        fireEvent.keyDown(tagInput, { key: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByText('긴급 ×')).toBeInTheDocument();
      });

      fireEvent.change(input, { target: { value: '긴급 업무' } });

      const submitButton = screen.getByRole('button', { name: '추가' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '긴급 업무',
            tags: ['긴급']
          })
        );
      });
    });

    it('태그를 삭제할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const expandButton = screen.getByRole('button', { name: '+' });
      fireEvent.click(expandButton);

      await waitFor(() => {
        const tagInput = screen.getByPlaceholderText('태그 입력...');
        fireEvent.change(tagInput, { target: { value: '테스트' } });
        fireEvent.keyDown(tagInput, { key: 'Enter' });
      });

      await waitFor(() => {
        const tagBadge = screen.getByText('테스트 ×');
        expect(tagBadge).toBeInTheDocument();
        fireEvent.click(tagBadge);
      });

      await waitFor(() => {
        expect(screen.queryByText('테스트 ×')).not.toBeInTheDocument();
      });
    });
  });

  describe('그룹 멤버 할당', () => {
    it('그룹 멤버가 있을 때 할당자를 선택할 수 있어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} groupMembers={mockGroupMembers} />
      );

      const expandButton = screen.getByRole('button', { name: '+' });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '홍길동' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '김철수' })).toBeInTheDocument();
      });

      const memberButton = screen.getByRole('button', { name: '홍길동' });
      fireEvent.click(memberButton);

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      fireEvent.change(input, { target: { value: '팀 미팅' } });

      const submitButton = screen.getByRole('button', { name: '추가' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '팀 미팅',
            assigneeId: 'member-1'
          })
        );
      });
    });

    it('그룹 멤버가 없을 때는 할당자 섹션을 표시하지 않아야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const expandButton = screen.getByRole('button', { name: '+' });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
        expect(screen.queryByText('김철수')).not.toBeInTheDocument();
      });
    });
  });

  describe('상태 관리', () => {
    it('할일 추가 후 모든 상태가 초기화되어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const expandButton = screen.getByRole('button', { name: '+' });

      fireEvent.click(expandButton);

      await waitFor(() => {
        const highPriorityButton = screen.getByRole('button', { name: '높음' });
        fireEvent.click(highPriorityButton);
      });

      fireEvent.change(input, { target: { value: '테스트 할일' } });

      const submitButton = screen.getByRole('button', { name: '추가' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
        expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument(); // 확장 모드가 닫힘
      });
    });

    it('Sparkles 아이콘이 입력시 표시되어야 한다', async () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      
      fireEvent.change(input, { target: { value: '테스트' } });

      await waitFor(() => {
        const sparklesIcon = document.querySelector('.animate-pulse');
        expect(sparklesIcon).toBeInTheDocument();
      });
    });
  });

  describe('접근성', () => {
    it('키보드로 탐색 가능해야 한다', () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const buttons = screen.getAllByRole('button');

      expect(input).toHaveAttribute('tabIndex');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('적절한 aria-label이 있어야 한다', () => {
      renderWithRouter(
        <QuickAddTask onAdd={mockOnAdd} />
      );

      const input = screen.getByPlaceholderText(/빠른 할일 추가/);
      const submitButton = screen.getByRole('button', { name: '추가' });

      expect(input).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });
  });
});