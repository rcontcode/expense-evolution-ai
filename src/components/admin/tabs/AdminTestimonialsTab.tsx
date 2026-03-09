import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { adminTranslations } from '../adminTranslations';

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
    ))}
  </div>
);

interface FeedbackItem {
  id: string;
  rating: number;
  comment?: string | null;
  suggestions?: string | null;
  user_name?: string;
  user_email?: string;
  created_at: string;
  allow_as_testimonial?: boolean;
  is_published_testimonial?: boolean;
  display_name_override?: string | null;
}

interface Props {
  allFeedback: FeedbackItem[] | undefined;
  toggleTestimonialPublish: { mutate: (args: { id: string; publish: boolean }) => void; isPending: boolean };
  language: 'es' | 'en';
}

export const AdminTestimonialsTab = ({ allFeedback, toggleTestimonialPublish, language }: Props) => {
  const text = adminTranslations[language];
  const formatDate = (date: string) =>
    format(new Date(date), "d MMM yyyy, HH:mm", { locale: language === 'es' ? esLocale : undefined });

  const testimonialFeedback = allFeedback?.filter(f => (f as any).allow_as_testimonial === true) || [];

  return (
    <Card className="border-2 border-cyan-100 dark:border-cyan-900/50 shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
            <Quote className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <CardTitle>{text.testimonialTitle}</CardTitle>
            <CardDescription>{text.testimonialDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {testimonialFeedback.length === 0 ? (
          <div className="text-center py-12">
            <Quote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{text.noTestimonials}</p>
            <p className="text-sm text-muted-foreground/70">{text.noTestimonialsHint}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonialFeedback.map((feedback, index) => {
              const isPublished = (feedback as any).is_published_testimonial === true;
              return (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-5 border-2 rounded-xl space-y-3 transition-all ${
                    isPublished ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-border hover:border-cyan-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{feedback.user_name || text.anonymous}</span>
                        {(feedback as any).display_name_override && (
                          <Badge variant="outline" className="text-xs">{text.displayAs} {(feedback as any).display_name_override}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feedback.user_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={feedback.rating} />
                      <Badge className={isPublished ? 'bg-emerald-100 text-emerald-700 border-emerald-200 border' : ''} variant={isPublished ? 'default' : 'secondary'}>
                        {isPublished ? `✅ ${text.published}` : text.pending}
                      </Badge>
                    </div>
                  </div>
                  {feedback.comment && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm italic">"{feedback.comment}"</p>
                    </div>
                  )}
                  {feedback.suggestions && (
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg">
                      <p className="text-xs font-medium text-amber-600 mb-1">{text.suggestions}</p>
                      <p className="text-sm">{feedback.suggestions}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant={isPublished ? 'destructive' : 'default'}
                      className={isPublished ? '' : 'bg-emerald-600 hover:bg-emerald-700'}
                      onClick={() => toggleTestimonialPublish.mutate({ id: feedback.id, publish: !isPublished })}
                      disabled={toggleTestimonialPublish.isPending}
                    >
                      {isPublished ? text.unpublish : text.publishToLanding}
                    </Button>
                    <span className="text-xs text-muted-foreground">📅 {formatDate(feedback.created_at)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
