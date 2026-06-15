import { Component, type ReactNode } from 'react';

type Props = { fallback: ReactNode; children: ReactNode };
type State = { hasError: boolean };

export default class ForestErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // 3D 渲染失败时降级，不打断学习主链路。
    console.warn('Forest 3D map failed, falling back to 2D trail.', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
