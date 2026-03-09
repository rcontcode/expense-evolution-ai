import { AnimatePresence, motion } from 'framer-motion';
import { Star, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { adminTranslations } from '../adminTranslations';

const APP_SECTIONS = [
  { id: 'dashboard', emoji: '📊' }, { id: 'expenses', emoji: '💸' }, { id: 'income', emoji: '💰' },
  { id: 'quick_capture', emoji: '📷' }, { id: 'voice_assistant', emoji: '🎤' }, { id: 'clients', emoji: '👥' },
  { id: 'projects', emoji: '📁' }, { id: 'contracts', emoji: '📄' }, { id: 'mileage', emoji: '🚗' },
  { id: 'net_worth', emoji: '🏦' }, { id: 'mentorship', emoji: '📚' }, { id: 'tax_calendar', emoji: '📅' },
  { id: 'banking', emoji: '🏧' }, { id: 'settings', emoji: '⚙️' }, { id: 'general', emoji: '🌟' },
];

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
    ))}
  </div>
);

const RatingBadge = ({ rating }: { rating: number }) => {
  const getColor = () => {
    if (rating >= 4.5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (rating >= 3.5) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (rating >= 2.5) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-rose-100 text-rose-700 border-rose-200';
  };
  const getEmoji = () => {
    if (rating >= 4.5) return '🔥';
    if (rating >= 3.5) return '✨';
    if (rating >= 2.5) return '👍';
    return '🤔';
  };
  return <Badge className={`${getColor()} border font-bold px-2`}>{getEmoji()} {rating.toFixed(1)}</Badge>;
};

interface FeedbackItem {
  id: string;
  section: string;
  rating: number;
  ease_of_use?: number | null;
  usefulness?: number | null;
  design_rating?: number | null;
  comment?: string | null;
  suggestions?: string | null;
  would_recommend?: boolean | null;
  user_name?: string;
  user_email?: string;
  created_at: string;
  [key: string]: unknown;
}

interface Props {
  allFeedback: FeedbackItem[] | undefined;
  language: 'es' | 'en';
}

export const AdminFeedbackTab = ({ allFeedback, language }: Props) => {
  const text = adminTranslations[language];
  const formatDate = (date: string) =>
    format(new Date(date), "d MMM yyyy, HH:mm", { locale: language === 'es' ? esLocale : undefined });

  return (
    <Card className="border-2 border-amber-100 dark:border-amber-900/50 shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <CardTitle>{text.allEvaluations}</CardTitle>
            <CardDescription>{text.allEvaluationsDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <AnimatePresence>
            {allFeedback?.map((feedback, index) => (
              <motion.div
                key={feedback.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 border-2 rounded-xl space-y-4 hover:border-amber-200 hover:shadow-md transition-all bg-gradient-to-r from-transparent to-amber-50/30 dark:to-amber-950/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 font-semibold">
                        {APP_SECTIONS.find(s => s.id === feedback.section)?.emoji} {feedback.section}
                      </Badge>
                      <StarDisplay rating={feedback.rating} />
                      <RatingBadge rating={feedback.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{feedback.user_name || text.anonymous}</span> • {feedback.user_email}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(feedback.created_at)}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm p-3 bg-muted/30 rounded-lg">
                  {feedback.ease_of_use && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎮</span>
                      <span className="text-muted-foreground">{text.ease}:</span>
                      <span className="font-bold">{feedback.ease_of_use}/5</span>
                    </div>
                  )}
                  {feedback.usefulness && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-muted-foreground">{text.usefulness}:</span>
                      <span className="font-bold">{feedback.usefulness}/5</span>
                    </div>
                  )}
                  {feedback.design_rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎨</span>
                      <span className="text-muted-foreground">{text.design}:</span>
                      <span className="font-bold">{feedback.design_rating}/5</span>
                    </div>
                  )}
                </div>

                {feedback.comment && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <p className="text-sm font-semibold mb-2">{text.comments}</p>
                    <p className="text-sm leading-relaxed">{feedback.comment}</p>
                  </div>
                )}

                {feedback.suggestions && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-lg border border-amber-100 dark:border-amber-900/50">
                    <p className="text-sm font-semibold mb-2">{text.suggestions}</p>
                    <p className="text-sm leading-relaxed">{feedback.suggestions}</p>
                  </div>
                )}

                {feedback.would_recommend !== null && (
                  <Badge className={`${
                    feedback.would_recommend
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border-rose-200'
                  } border font-medium`}>
                    {feedback.would_recommend ? text.wouldRecommendBadge : text.wouldNotRecommend}
                  </Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {(!allFeedback || allFeedback.length === 0) && (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">{text.noFeedback}</p>
              <p className="text-sm text-muted-foreground/70">{text.noFeedbackHint}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
