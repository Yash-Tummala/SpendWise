import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import './ErrorBoundary.css';

export default class ErrorBoundary extends Component {
  state={hasError:false};
  static getDerivedStateFromError(){return {hasError:true}}
  componentDidCatch(error){console.error('SpendWise recovered from a screen error:',error)}
  render(){if(this.state.hasError)return <main className="app-error"><div><span><TriangleAlert size={26}/></span><h1>Something needs a quick refresh</h1><p>Your stored SpendWise data is safe. Reload the page to continue.</p><button className="button button-primary" onClick={()=>window.location.reload()}><RefreshCw size={16}/>Refresh SpendWise</button></div></main>;return this.props.children}
}
