import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-700">Ứng dụng gặp sự cố</h2>
          <Link to="/" className="text-rose-500 hover:underline">Về trang chủ</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
