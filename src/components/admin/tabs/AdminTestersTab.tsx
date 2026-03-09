import { motion } from 'framer-motion';
import { Users, Trophy, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminBetaControls } from '@/components/beta/AdminBetaControls';
import { BetaExpirationBadge } from '@/components/beta/BetaExpirationBadge';
import { adminTranslations } from '../adminTranslations';

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

interface UserStat {
  user_id: string;
  user_name: string;
  user_email: string;
  beta_expires_at: string | null;
  total_actions: number;
  unique_features: number;
  avg_rating: number;
}

interface Props {
  userStats: UserStat[] | undefined;
  language: 'es' | 'en';
}

export const AdminTestersTab = ({ userStats, language }: Props) => {
  const text = adminTranslations[language];

  return (
    <Card className="border-2 border-violet-100 dark:border-violet-900/50 shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Trophy className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <CardTitle>{text.vipTesters}</CardTitle>
            <CardDescription>{text.vipTestersDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">{text.user}</TableHead>
              <TableHead className="font-bold">{text.email}</TableHead>
              <TableHead className="text-center font-bold">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {text.expiration}
                </div>
              </TableHead>
              <TableHead className="text-center font-bold">{text.actions}</TableHead>
              <TableHead className="text-center font-bold">{text.features}</TableHead>
              <TableHead className="text-center font-bold">{text.rating}</TableHead>
              <TableHead className="font-bold">{text.control}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userStats?.map((user, index) => (
              <motion.tr
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
              >
                <TableCell className="font-semibold">
                  <div className="flex items-center gap-2">
                    {index < 3 && <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>}
                    {user.user_name || text.noName}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.user_email}</TableCell>
                <TableCell className="text-center"><BetaExpirationBadge expiresAt={user.beta_expires_at} /></TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-violet-100 text-violet-700 border-violet-200 border font-bold">{user.total_actions}</Badge>
                </TableCell>
                <TableCell className="text-center font-medium">{user.unique_features}</TableCell>
                <TableCell className="text-center">
                  {user.avg_rating > 0 ? <RatingBadge rating={user.avg_rating} /> : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>
                  <AdminBetaControls userId={user.user_id} userName={user.user_name || text.noName} userEmail={user.user_email} expiresAt={user.beta_expires_at} isBetaTester={true} />
                </TableCell>
              </motion.tr>
            ))}
            {(!userStats || userStats.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">{text.noTesters}</p>
                  <p className="text-sm text-muted-foreground/70">{text.shareCodesHint}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
