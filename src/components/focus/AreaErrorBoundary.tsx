 import { Component, ReactNode } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { AlertTriangle, RefreshCw } from 'lucide-react';
 
 interface Props {
   children: ReactNode;
   areaName: string;
 }
 
 interface State {
   hasError: boolean;
   error?: Error;
 }
 
 export class AreaErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
     super(props);
     this.state = { hasError: false };
   }
 
   static getDerivedStateFromError(error: Error): State {
     return { hasError: true, error };
   }
 
   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
     console.error(`Error in area ${this.props.areaName}:`, error, errorInfo);
   }
 
   handleRetry = () => {
     this.setState({ hasError: false, error: undefined });
   };
 
   render() {
     if (this.state.hasError) {
       return (
         <Card className="border-destructive/50 bg-destructive/5">
           <CardContent className="py-8 text-center">
             <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
               <AlertTriangle className="h-6 w-6 text-destructive" />
             </div>
             <h4 className="font-medium text-destructive mb-2">
               Error al cargar {this.props.areaName}
             </h4>
             <p className="text-sm text-muted-foreground mb-4">
               Hubo un problema al cargar esta sección. Intenta de nuevo.
             </p>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={this.handleRetry}
               className="gap-2"
             >
               <RefreshCw className="h-4 w-4" />
               Reintentar
             </Button>
           </CardContent>
         </Card>
       );
     }
 
     return this.props.children;
   }
 }