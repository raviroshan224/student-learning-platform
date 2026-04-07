import { describe, it, expect } from 'vitest';
import { mockExamsService } from './exams';
import { MOCK_EXAMS } from './data';

describe('mockExamsService', () => {
  it('getAll returns a copy of mock exams', async () => {
    const all = await mockExamsService.getAll();
    expect(all).toHaveLength(MOCK_EXAMS.length);
    // Ensure it's a deep copy, modifying returned shouldn't mutate original
    const first = all[0];
    first.title = 'modified-title';
    const original = MOCK_EXAMS[0];
    expect(original.title).not.toBe('modified-title');
  });

  it('getById returns correct exam or null', async () => {
    const ex = await mockExamsService.getById('ex1');
    expect(ex).not.toBeNull();
    expect(ex?.id).toBe('ex1');

    const none = await mockExamsService.getById('no-such-id');
    expect(none).toBeNull();
  });

  it('submit computes result and updates exam status', async () => {
    // Prepare answers mapping correct answers for ex1
    const exam = MOCK_EXAMS.find((e) => e.id === 'ex1');
    expect(exam).toBeDefined();
    const answers: Record<string, string> = {};
    exam!.questions.forEach((q) => {
      answers[q.id] = q.correctAnswer;
    });

    const res = await mockExamsService.submit('ex1', answers);
    expect(res).toHaveProperty('percentage');
    expect(res.passed).toBe(true);
    // After submit, exam.status should be 'completed'
    const updated = await mockExamsService.getById('ex1');
    expect(updated?.status).toBe('completed');
  });
});
