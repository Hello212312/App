// Error boundary component to catch runtime errors and display a fallback UI.
// This helps prevent the whole app from crashing and provides a way to log/report errors.

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    // Here you could log to an external service.
    console.error('ErrorBoundary caught an error:', error, info);
    this.setState({ error });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong.</Text>
          {this.state.error && <Text style={styles.message}>{this.state.error.message}</Text>}
          <Button title="Try again" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
});
