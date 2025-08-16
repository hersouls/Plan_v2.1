/**
 * 네비게이션 콜백 관리 유틸리티
 * URL 상태 기반으로 컴포넌트 간 콜백을 관리하고 브라우저 히스토리를 깔끔하게 유지
 */

export interface NavigationState {
  returnPath?: string;
  returnQuery?: Record<string, string>;
  returnFragment?: string;
  contextData?: Record<string, any>;
}

export class NavigationCallback {
  /**
   * 콜백 정보를 URL에 인코딩
   */
  static encodeCallback(
    targetPath: string, 
    returnPath: string,
    options?: {
      query?: Record<string, string>;
      fragment?: string;
      contextData?: Record<string, any>;
    }
  ): string {
    const url = new URL(targetPath, window.location.origin);
    
    // 기본 리턴 패스
    url.searchParams.set('returnPath', returnPath);
    
    // 쿼리 파라미터
    if (options?.query) {
      url.searchParams.set('returnQuery', JSON.stringify(options.query));
    }
    
    // 프래그먼트
    if (options?.fragment) {
      url.searchParams.set('returnFragment', options.fragment);
    }
    
    // 컨텍스트 데이터
    if (options?.contextData) {
      url.searchParams.set('contextData', JSON.stringify(options.contextData));
    }
    
    return url.pathname + url.search;
  }
  
  /**
   * URL에서 콜백 정보를 디코딩
   */
  static decodeCallback(searchParams: URLSearchParams): NavigationState | null {
    const returnPath = searchParams.get('returnPath');
    if (!returnPath) return null;
    
    const state: NavigationState = { returnPath };
    
    // 쿼리 파라미터 복원
    const returnQuery = searchParams.get('returnQuery');
    if (returnQuery) {
      try {
        state.returnQuery = JSON.parse(returnQuery);
      } catch (e) {
        console.warn('Failed to parse returnQuery:', e);
      }
    }
    
    // 프래그먼트 복원
    const returnFragment = searchParams.get('returnFragment');
    if (returnFragment) {
      state.returnFragment = returnFragment;
    }
    
    // 컨텍스트 데이터 복원
    const contextData = searchParams.get('contextData');
    if (contextData) {
      try {
        state.contextData = JSON.parse(contextData);
      } catch (e) {
        console.warn('Failed to parse contextData:', e);
      }
    }
    
    return state;
  }
  
  /**
   * 콜백을 실행하여 원래 위치로 이동
   */
  static executeCallback(
    navigate: (path: string) => void,
    state: NavigationState,
    options?: {
      cleanupHistory?: boolean;
      scrollToElement?: string;
    }
  ): void {
    let targetPath = state.returnPath!;
    
    // 쿼리 파라미터 추가
    if (state.returnQuery) {
      const url = new URL(targetPath, window.location.origin);
      Object.entries(state.returnQuery).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      targetPath = url.pathname + url.search;
    }
    
    // 프래그먼트 추가
    if (state.returnFragment) {
      targetPath += '#' + state.returnFragment;
    }
    
    navigate(targetPath);
    
    // 히스토리 정리
    if (options?.cleanupHistory) {
      // 다음 틱에서 히스토리 정리 (페이지 이동 후)
      setTimeout(() => {
        if (state.returnFragment) {
          // 프래그먼트 제거하여 URL 깔끔하게 유지
          const cleanUrl = targetPath.split('#')[0];
          window.history.replaceState(null, '', cleanUrl);
        }
        
        // 특정 요소로 스크롤
        if (options?.scrollToElement) {
          const element = document.getElementById(options.scrollToElement);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    }
  }
  
  /**
   * 현재 위치를 기반으로 콜백 URL 생성
   */
  static createCallbackFromCurrent(
    targetPath: string,
    options?: {
      preserveQuery?: boolean;
      preserveFragment?: boolean;
      contextData?: Record<string, any>;
    }
  ): string {
    const currentPath = window.location.pathname;
    const currentSearch = new URLSearchParams(window.location.search);
    const currentFragment = window.location.hash.substring(1);
    
    const callbackOptions: any = {};
    
    // 현재 쿼리 파라미터 보존
    if (options?.preserveQuery && currentSearch.toString()) {
      const queryObj: Record<string, string> = {};
      currentSearch.forEach((value, key) => {
        // 콜백 관련 파라미터는 제외
        if (!key.startsWith('return') && key !== 'contextData') {
          queryObj[key] = value;
        }
      });
      if (Object.keys(queryObj).length > 0) {
        callbackOptions.query = queryObj;
      }
    }
    
    // 현재 프래그먼트 보존
    if (options?.preserveFragment && currentFragment) {
      callbackOptions.fragment = currentFragment;
    }
    
    // 컨텍스트 데이터 추가
    if (options?.contextData) {
      callbackOptions.contextData = options.contextData;
    }
    
    return this.encodeCallback(targetPath, currentPath, callbackOptions);
  }
  
  /**
   * 스마트 뒤로가기 - 콜백이 있으면 콜백 실행, 없으면 기본 뒤로가기
   */
  static smartGoBack(
    navigate: (path: string) => void,
    searchParams: URLSearchParams,
    fallbackPath: string = '/'
  ): void {
    const callbackState = this.decodeCallback(searchParams);
    
    if (callbackState) {
      this.executeCallback(navigate, callbackState, { cleanupHistory: true });
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate(fallbackPath);
    }
  }

  /**
   * 에러 발생 시 콜백 처리 - 에러 메시지와 함께 지연된 콜백 실행
   */
  static handleErrorWithCallback(
    navigate: (path: string) => void,
    searchParams: URLSearchParams,
    options?: {
      delay?: number;
      fallbackPath?: string;
      preserveErrorState?: boolean;
    }
  ): void {
    const delay = options?.delay ?? 3000;
    const fallbackPath = options?.fallbackPath ?? '/';
    
    setTimeout(() => {
      if (options?.preserveErrorState) {
        // 에러 상태를 유지하면서 콜백 실행 (에러 메시지가 새 페이지에서도 보이도록)
        const callbackState = this.decodeCallback(searchParams);
        if (callbackState && callbackState.returnQuery) {
          callbackState.returnQuery.error = 'operation_failed';
        }
        
        if (callbackState) {
          this.executeCallback(navigate, callbackState, { cleanupHistory: true });
        } else {
          navigate(fallbackPath + '?error=operation_failed');
        }
      } else {
        this.smartGoBack(navigate, searchParams, fallbackPath);
      }
    }, delay);
  }
}

/**
 * 콜백 관련 React Hook
 */
export const useNavigationCallback = (searchParams: URLSearchParams) => {
  const callbackState = NavigationCallback.decodeCallback(searchParams);
  
  return {
    hasCallback: !!callbackState,
    callbackState,
    executeCallback: (navigate: (path: string) => void) => {
      if (callbackState) {
        NavigationCallback.executeCallback(navigate, callbackState, { cleanupHistory: true });
      }
    },
    smartGoBack: (navigate: (path: string) => void, fallbackPath?: string) => {
      NavigationCallback.smartGoBack(navigate, searchParams, fallbackPath);
    },
    handleErrorWithCallback: (
      navigate: (path: string) => void,
      options?: {
        delay?: number;
        fallbackPath?: string;
        preserveErrorState?: boolean;
      }
    ) => {
      NavigationCallback.handleErrorWithCallback(navigate, searchParams, options);
    }
  };
};

/**
 * Day 특화 콜백 유틸리티
 */
export class DayNavigationCallback extends NavigationCallback {
  /**
   * Day 정보를 포함한 콜백 URL 생성
   */
  static createDayCallback(targetPath: string, tripId: string, selectedDay: number): string {
    const returnPath = `/trips/${tripId}`;
    return this.encodeCallback(targetPath, returnPath, {
      fragment: `day-${selectedDay}`,
      contextData: { selectedDay, tripId }
    });
  }
  
  /**
   * Day 콜백을 실행하고 특정 Day 탭을 선택
   */
  static executeDayCallback(
    navigate: (path: string) => void,
    state: NavigationState
  ): void {
    this.executeCallback(navigate, state, {
      cleanupHistory: true,
      scrollToElement: state.contextData?.selectedDay ? `day-tab-${state.contextData.selectedDay}` : undefined
    });
  }
}