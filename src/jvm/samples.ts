import { BytecodeParser } from './parser';
import { ConstantPoolEntry, MethodMetadata } from './types';

export interface TestCaseDef {
  name: string;
  args: number[];
  expected: number;
  description: string;
}

export interface SampleProgramDef {
  id: string;
  name: string;
  category: 'leetcode' | 'math' | 'algo' | 'heap' | 'recursion' | 'bitwise';
  leetcodeId?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  className: string;
  methodName: string;
  descriptor: string;
  description: string;
  defaultArgs: number[];
  argLabels: string[];
  testCases?: TestCaseDef[];
  maxStack: number;
  maxLocals: number;
  assemblySource: string;
  constantPool: ConstantPoolEntry[];
  javaSourceSnippet: string;
}

export const SAMPLE_PROGRAMS: SampleProgramDef[] = [
  // ==========================================
  // LEETCODE PROBLEMS
  // ==========================================

  {
    id: 'lc_1_two_sum',
    name: 'LeetCode 1: Two Sum',
    category: 'leetcode',
    leetcodeId: 1,
    difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'],
    className: 'TwoSum',
    methodName: 'findPair',
    descriptor: '(I)I',
    description: 'Finds two numbers in a sorted heap array [2, 7, 11, 15] that add up to target. Returns leftIndex * 10 + rightIndex (e.g., target 9 -> returns 1 for index 0 and 1).',
    defaultArgs: [9],
    argLabels: ['target (Sum to find)'],
    testCases: [
      { name: 'Test 1 (Target = 9)', args: [9], expected: 1, description: '2 + 7 = 9 at indices 0 and 1 -> returns 01' },
      { name: 'Test 2 (Target = 18)', args: [18], expected: 13, description: '7 + 11 = 18 at indices 1 and 2 -> returns 12' },
      { name: 'Test 3 (Target = 26)', args: [26], expected: 23, description: '11 + 15 = 26 at indices 2 and 3 -> returns 23' },
    ],
    maxStack: 6,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'TwoSum' }],
    javaSourceSnippet: `public static int findPair(int target) {
    int[] nums = { 2, 7, 11, 15 };
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return left * 10 + right;
        if (sum < target) left++;
        else right--;
    }
    return -1;
}`,
    assemblySource: `// TwoSum.findPair(target) -> LVT: 0=target, 1=nums, 2=left, 3=right, 4=sum
iconst_4
newarray 10
astore_1

// Fill nums = [2, 7, 11, 15]
aload_1
iconst_0
iconst_2
iastore
aload_1
iconst_1
bipush 7
iastore
aload_1
iconst_2
bipush 11
iastore
aload_1
iconst_3
bipush 15
iastore

iconst_0
istore_2            // left = 0
iconst_3
istore_3            // right = 3

LOOP:
iload_2
iload_3
if_icmpge NOT_FOUND // while (left < right)

// sum = nums[left] + nums[right]
aload_1
iload_2
iaload
aload_1
iload_3
iaload
iadd
istore 4

// if sum == target -> return left * 10 + right
iload 4
iload_0
if_icmpeq FOUND

// if sum < target -> left++
iload 4
iload_0
if_icmplt MOVE_LEFT

// else right--
iinc 3 -1
goto LOOP

MOVE_LEFT:
iinc 2 1
goto LOOP

FOUND:
iload_2
bipush 10
imul
iload_3
iadd
ireturn

NOT_FOUND:
iconst_m1
ireturn`,
  },

  {
    id: 'lc_9_palindrome',
    name: 'LeetCode 9: Palindrome Number',
    category: 'leetcode',
    leetcodeId: 9,
    difficulty: 'Easy',
    tags: ['Math'],
    className: 'PalindromeNumber',
    methodName: 'isPalindrome',
    descriptor: '(I)I',
    description: 'Given an integer x, return 1 if x is a palindrome, and 0 otherwise without converting the integer to a string.',
    defaultArgs: [1221],
    argLabels: ['x (Integer)'],
    testCases: [
      { name: 'Test 1 (1221)', args: [1221], expected: 1, description: '1221 reads same forwards and backwards' },
      { name: 'Test 2 (-121)', args: [-121], expected: 0, description: 'Negative numbers are not palindromes' },
      { name: 'Test 3 (1234)', args: [1234], expected: 0, description: '1234 != 4321' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'PalindromeNumber' }],
    javaSourceSnippet: `public static int isPalindrome(int x) {
    if (x < 0) return 0;
    int temp = x, rev = 0;
    while (temp != 0) {
        rev = rev * 10 + (temp % 10);
        temp /= 10;
    }
    return (x == rev) ? 1 : 0;
}`,
    assemblySource: `// PalindromeNumber.isPalindrome(x) -> LVT: 0=x, 1=temp, 2=rev, 3=digit
iload_0
iflt NOT_PALINDROME // x < 0 -> 0

iload_0
istore_1            // temp = x
iconst_0
istore_2            // rev = 0

REV_LOOP:
iload_1
ifeq CHECK

iload_1
bipush 10
irem
istore_3            // digit = temp % 10

iload_2
bipush 10
imul
iload_3
iadd
istore_2            // rev = rev * 10 + digit

iload_1
bipush 10
idiv
istore_1            // temp /= 10
goto REV_LOOP

CHECK:
iload_0
iload_2
if_icmpne NOT_PALINDROME
iconst_1
ireturn

NOT_PALINDROME:
iconst_0
ireturn`,
  },

  {
    id: 'lc_11_container_water',
    name: 'LeetCode 11: Container With Most Water',
    category: 'leetcode',
    leetcodeId: 11,
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    className: 'ContainerWithMostWater',
    methodName: 'maxArea',
    descriptor: '()I',
    description: 'Finds two vertical lines from [1, 8, 6, 2, 5, 4, 8, 3, 7] that together with the x-axis form a container containing the most water. Returns maximum area.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 (Standard heights)', args: [], expected: 49, description: 'Between height 8 (idx 1) and height 7 (idx 8), width 7: 7 * 7 = 49' },
    ],
    maxStack: 6,
    maxLocals: 7,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'ContainerWithMostWater' }],
    javaSourceSnippet: `public static int maxArea() {
    int[] h = { 1, 8, 6, 2, 5, 4, 8, 3, 7 };
    int left = 0, right = h.length - 1;
    int maxWater = 0;
    while (left < right) {
        int width = right - left;
        int height = (h[left] < h[right]) ? h[left] : h[right];
        int area = width * height;
        if (area > maxWater) maxWater = area;
        if (h[left] < h[right]) left++;
        else right--;
    }
    return maxWater;
}`,
    assemblySource: `// ContainerWithMostWater.maxArea()
// LVT: 0=h, 1=left, 2=right, 3=maxWater, 4=width, 5=minH, 6=area
bipush 9
newarray 10
astore_0

// Fill h = [1, 8, 6, 2, 5, 4, 8, 3, 7]
aload_0
iconst_0
iconst_1
iastore
aload_0
iconst_1
bipush 8
iastore
aload_0
iconst_2
bipush 6
iastore
aload_0
iconst_3
iconst_2
iastore
aload_0
iconst_4
iconst_5
iastore
aload_0
iconst_5
iconst_4
iastore
aload_0
bipush 6
bipush 8
iastore
aload_0
bipush 7
iconst_3
iastore
aload_0
bipush 8
bipush 7
iastore

iconst_0
istore_1            // left = 0
bipush 8
istore_2            // right = 8
iconst_0
istore_3            // maxWater = 0

WATER_LOOP:
iload_1
iload_2
if_icmpge DONE

// width = right - left
iload_2
iload_1
isub
istore 4

// minH = min(h[left], h[right])
aload_0
iload_1
iaload
aload_0
iload_2
iaload
if_icmpgt RIGHT_SMALLER

// left is smaller or equal
aload_0
iload_1
iaload
istore 5
goto CALC_AREA

RIGHT_SMALLER:
aload_0
iload_2
iaload
istore 5

CALC_AREA:
// area = width * minH
iload 4
iload 5
imul
istore 6

// if (area > maxWater) maxWater = area
iload 6
iload_3
if_icmple ADVANCE_PTR
iload 6
istore_3

ADVANCE_PTR:
aload_0
iload_1
iaload
aload_0
iload_2
iaload
if_icmpgt ADVANCE_RIGHT

iinc 1 1            // left++
goto WATER_LOOP

ADVANCE_RIGHT:
iinc 2 -1           // right--
goto WATER_LOOP

DONE:
iload_3             // return maxWater (49)
ireturn`,
  },

  {
    id: 'lc_26_remove_duplicates',
    name: 'LeetCode 26: Remove Duplicates',
    category: 'leetcode',
    leetcodeId: 26,
    difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'],
    className: 'RemoveDuplicates',
    methodName: 'removeDuplicates',
    descriptor: '()I',
    description: 'Removes duplicates in-place from sorted array [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] on the heap such that each unique element appears once. Returns new length k.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 (Array of 10 items)', args: [], expected: 5, description: 'Unique items: 0, 1, 2, 3, 4 -> length 5' },
    ],
    maxStack: 5,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'RemoveDuplicates' }],
    javaSourceSnippet: `public static int removeDuplicates() {
    int[] nums = { 0, 0, 1, 1, 1, 2, 2, 3, 3, 4 };
    int len = nums.length;
    if (len == 0) return 0;
    int k = 1;
    for (int i = 1; i < len; i++) {
        if (nums[i] != nums[i - 1]) {
            nums[k] = nums[i];
            k++;
        }
    }
    return k;
}`,
    assemblySource: `// RemoveDuplicates.removeDuplicates()
// LVT: 0=nums, 1=len, 2=k, 3=i, 4=val
bipush 10
newarray 10
astore_0

// Fill sorted array [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
aload_0
iconst_0
iconst_0
iastore
aload_0
iconst_1
iconst_0
iastore
aload_0
iconst_2
iconst_1
iastore
aload_0
iconst_3
iconst_1
iastore
aload_0
iconst_4
iconst_1
iastore
aload_0
iconst_5
iconst_2
iastore
aload_0
bipush 6
iconst_2
iastore
aload_0
bipush 7
iconst_3
iastore
aload_0
bipush 8
iconst_3
iastore
aload_0
bipush 9
iconst_4
iastore

bipush 10
istore_1            // len = 10
iconst_1
istore_2            // k = 1
iconst_1
istore_3            // i = 1

LOOP:
iload_3
iload_1
if_icmpge DONE

// check if nums[i] != nums[i - 1]
aload_0
iload_3
iaload
aload_0
iload_3
iconst_1
isub
iaload
if_icmpeq SKIP

// nums[k] = nums[i]
aload_0
iload_2
aload_0
iload_3
iaload
iastore
iinc 2 1            // k++

SKIP:
iinc 3 1            // i++
goto LOOP

DONE:
iload_2             // return k (5)
ireturn`,
  },

  {
    id: 'lc_50_pow',
    name: 'LeetCode 50: Pow(x, n)',
    category: 'leetcode',
    leetcodeId: 50,
    difficulty: 'Medium',
    tags: ['Math', 'Divide & Conquer'],
    className: 'PowSolution',
    methodName: 'myPow',
    descriptor: '(II)I',
    description: 'Calculates x raised to the power n in O(log n) using binary exponentiation, bitwise AND and shifts.',
    defaultArgs: [2, 10],
    argLabels: ['x (Base)', 'n (Exponent)'],
    testCases: [
      { name: 'Test 1 (2^10)', args: [2, 10], expected: 1024, description: '2^10 = 1024' },
      { name: 'Test 2 (3^5)', args: [3, 5], expected: 243, description: '3^5 = 243' },
      { name: 'Test 3 (5^0)', args: [5, 0], expected: 1, description: '5^0 = 1' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'PowSolution' }],
    javaSourceSnippet: `public static int myPow(int x, int n) {
    int res = 1;
    while (n > 0) {
        if ((n & 1) != 0) res *= x;
        x *= x;
        n >>>= 1;
    }
    return res;
}`,
    assemblySource: `// PowSolution.myPow(x, n) -> LVT: 0=x, 1=n, 2=res
iconst_1
istore_2            // res = 1

LOOP:
iload_1
ifeq DONE

// if ((n & 1) != 0) res *= x
iload_1
iconst_1
iand
ifeq SQUARE

iload_2
iload_0
imul
istore_2

SQUARE:
iload_0
iload_0
imul
istore_0            // x *= x

iload_1
iconst_1
iushr
istore_1            // n >>>= 1
goto LOOP

DONE:
iload_2
ireturn`,
  },

  {
    id: 'lc_53_max_subarray',
    name: 'LeetCode 53: Maximum Subarray',
    category: 'leetcode',
    leetcodeId: 53,
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming'],
    className: 'MaxSubarray',
    methodName: 'maxSubArray',
    descriptor: '()I',
    description: "Kadane's Algorithm finding the contiguous subarray in [-2, 1, -3, 4, -1, 2, 1, -5, 4] with the largest sum. Returns 6 ([4, -1, 2, 1]).",
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 (Classic Kadane array)', args: [], expected: 6, description: 'Subarray [4, -1, 2, 1] has largest sum = 6' },
    ],
    maxStack: 5,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'MaxSubarray' }],
    javaSourceSnippet: `public static int maxSubArray() {
    int[] nums = { -2, 1, -3, 4, -1, 2, 1, -5, 4 };
    int maxSoFar = nums[0];
    int currMax = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currMax = (nums[i] > currMax + nums[i]) ? nums[i] : currMax + nums[i];
        if (currMax > maxSoFar) maxSoFar = currMax;
    }
    return maxSoFar;
}`,
    assemblySource: `// MaxSubarray.maxSubArray()
// LVT: 0=nums, 1=len, 2=maxSoFar, 3=currMax, 4=i, 5=sum
bipush 9
newarray 10
astore_0

// Fill nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
aload_0
iconst_0
bipush -2
iastore
aload_0
iconst_1
iconst_1
iastore
aload_0
iconst_2
bipush -3
iastore
aload_0
iconst_3
iconst_4
iastore
aload_0
iconst_4
iconst_m1
iastore
aload_0
iconst_5
iconst_2
iastore
aload_0
bipush 6
iconst_1
iastore
aload_0
bipush 7
bipush -5
iastore
aload_0
bipush 8
iconst_4
iastore

bipush 9
istore_1            // len = 9
bipush -2
istore_2            // maxSoFar = nums[0] = -2
bipush -2
istore_3            // currMax = -2
iconst_1
istore 4            // i = 1

LOOP:
iload 4
iload_1
if_icmpge DONE

// sum = currMax + nums[i]
iload_3
aload_0
iload 4
iaload
iadd
istore 5

// currMax = max(nums[i], sum)
aload_0
iload 4
iaload
iload 5
if_icmple TAKE_SUM

aload_0
iload 4
iaload
istore_3
goto UPDATE_GLOBAL

TAKE_SUM:
iload 5
istore_3

UPDATE_GLOBAL:
iload_3
iload_2
if_icmple NEXT_ITEM
iload_3
istore_2

NEXT_ITEM:
iinc 4 1            // i++
goto LOOP

DONE:
iload_2             // return maxSoFar (6)
ireturn`,
  },

  {
    id: 'lc_70_climbing_stairs',
    name: 'LeetCode 70: Climbing Stairs',
    category: 'leetcode',
    leetcodeId: 70,
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math'],
    className: 'ClimbStairs',
    methodName: 'climbStairs',
    descriptor: '(I)I',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. How many distinct ways can you climb to the top?',
    defaultArgs: [5],
    argLabels: ['n (Steps)'],
    testCases: [
      { name: 'Test 1 (n = 2)', args: [2], expected: 2, description: '1+1 or 2 -> 2 ways' },
      { name: 'Test 2 (n = 3)', args: [3], expected: 3, description: '1+1+1, 1+2, 2+1 -> 3 ways' },
      { name: 'Test 3 (n = 5)', args: [5], expected: 8, description: 'Fibonacci recurrence -> 8 ways' },
    ],
    maxStack: 4,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'ClimbStairs' }],
    javaSourceSnippet: `public static int climbStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}`,
    assemblySource: `// ClimbStairs.climbStairs(n) -> LVT: 0=n, 1=prev2, 2=prev1, 3=i, 4=curr
iload_0
iconst_2
if_icmpgt LOOP_INIT
iload_0
ireturn

LOOP_INIT:
iconst_1
istore_1            // prev2 = 1
iconst_2
istore_2            // prev1 = 2
iconst_3
istore_3            // i = 3

STEP_LOOP:
iload_3
iload_0
if_icmpgt FINISHED

iload_2
iload_1
iadd
istore 4            // curr = prev1 + prev2

iload_2
istore_1            // prev2 = prev1
iload 4
istore_2            // prev1 = curr

iinc 3 1            // i++
goto STEP_LOOP

FINISHED:
iload_2
ireturn`,
  },

  {
    id: 'lc_121_stock_profit',
    name: 'LeetCode 121: Best Time to Buy/Sell Stock',
    category: 'leetcode',
    leetcodeId: 121,
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    className: 'StockProfit',
    methodName: 'maxProfit',
    descriptor: '()I',
    description: 'Finds maximum profit from stock prices [7, 1, 5, 3, 6, 4] by choosing a single day to buy and a different day in future to sell. Returns 5 (buy at 1, sell at 6).',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 (Standard prices)', args: [], expected: 5, description: 'Buy day 2 (price 1), sell day 5 (price 6): profit = 5' },
    ],
    maxStack: 5,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'StockProfit' }],
    javaSourceSnippet: `public static int maxProfit() {
    int[] prices = { 7, 1, 5, 3, 6, 4 };
    int minPrice = prices[0];
    int maxProfit = 0;
    for (int i = 1; i < prices.length; i++) {
        if (prices[i] < minPrice) minPrice = prices[i];
        else if (prices[i] - minPrice > maxProfit) maxProfit = prices[i] - minPrice;
    }
    return maxProfit;
}`,
    assemblySource: `// StockProfit.maxProfit()
// LVT: 0=prices, 1=minPrice, 2=maxProfit, 3=i, 4=len, 5=profit
bipush 6
newarray 10
astore_0

// Fill prices = [7, 1, 5, 3, 6, 4]
aload_0
iconst_0
bipush 7
iastore
aload_0
iconst_1
iconst_1
iastore
aload_0
iconst_2
iconst_5
iastore
aload_0
iconst_3
iconst_3
iastore
aload_0
iconst_4
bipush 6
iastore
aload_0
iconst_5
iconst_4
iastore

bipush 7
istore_1            // minPrice = 7
iconst_0
istore_2            // maxProfit = 0
iconst_1
istore_3            // i = 1
bipush 6
istore 4            // len = 6

LOOP:
iload_3
iload 4
if_icmpge DONE

// check prices[i] < minPrice
aload_0
iload_3
iaload
iload_1
if_icmpge CHECK_PROFIT

aload_0
iload_3
iaload
istore_1            // minPrice = prices[i]
goto NEXT

CHECK_PROFIT:
aload_0
iload_3
iaload
iload_1
isub
istore 5            // profit = prices[i] - minPrice

iload 5
iload_2
if_icmple NEXT
iload 5
istore_2            // maxProfit = profit

NEXT:
iinc 3 1            // i++
goto LOOP

DONE:
iload_2             // return maxProfit (5)
ireturn`,
  },

  {
    id: 'lc_136_single_number',
    name: 'LeetCode 136: Single Number',
    category: 'leetcode',
    leetcodeId: 136,
    difficulty: 'Easy',
    tags: ['Bit Manipulation', 'Array'],
    className: 'SingleNumber',
    methodName: 'singleNumber',
    descriptor: '()I',
    description: 'Every element in array [4, 1, 2, 1, 2] appears twice except for one. Finds that single one using bitwise XOR reduction in O(n) time and O(1) space.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 ([4, 1, 2, 1, 2])', args: [], expected: 4, description: '4 is the only number without a duplicate' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'SingleNumber' }],
    javaSourceSnippet: `public static int singleNumber() {
    int[] nums = { 4, 1, 2, 1, 2 };
    int result = 0;
    for (int i = 0; i < nums.length; i++) {
        result ^= nums[i];
    }
    return result;
}`,
    assemblySource: `// SingleNumber.singleNumber() -> LVT: 0=nums, 1=result, 2=i, 3=len
iconst_5
newarray 10
astore_0

// Fill nums = [4, 1, 2, 1, 2]
aload_0
iconst_0
iconst_4
iastore
aload_0
iconst_1
iconst_1
iastore
aload_0
iconst_2
iconst_2
iastore
aload_0
iconst_3
iconst_1
iastore
aload_0
iconst_4
iconst_2
iastore

iconst_0
istore_1            // result = 0
iconst_0
istore_2            // i = 0
iconst_5
istore_3            // len = 5

LOOP:
iload_2
iload_3
if_icmpge DONE

iload_1
aload_0
iload_2
iaload
ixor                // result ^= nums[i]
istore_1

iinc 2 1            // i++
goto LOOP

DONE:
iload_1             // return 4
ireturn`,
  },

  {
    id: 'lc_191_number_1_bits',
    name: 'LeetCode 191: Number of 1 Bits',
    category: 'leetcode',
    leetcodeId: 191,
    difficulty: 'Easy',
    tags: ['Bit Manipulation'],
    className: 'HammingWeight',
    methodName: 'hammingWeight',
    descriptor: '(I)I',
    description: 'Takes an integer n and returns the number of set bits it has (also known as the Hamming weight) using bitwise shifts.',
    defaultArgs: [29],
    argLabels: ['n (Integer)'],
    testCases: [
      { name: 'Test 1 (29 = 0b11101)', args: [29], expected: 4, description: '4 set bits in 29' },
      { name: 'Test 2 (128 = 0b10000000)', args: [128], expected: 1, description: 'Power of 2 has 1 bit' },
      { name: 'Test 3 (255 = 0b11111111)', args: [255], expected: 8, description: 'Full byte has 8 bits' },
    ],
    maxStack: 3,
    maxLocals: 3,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'HammingWeight' }],
    javaSourceSnippet: `public static int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        count += (n & 1);
        n >>>= 1;
    }
    return count;
}`,
    assemblySource: `// HammingWeight.hammingWeight(n) -> LVT: 0=n, 1=count
iconst_0
istore_1            // count = 0

LOOP:
iload_0
ifeq DONE

iload_1
iload_0
iconst_1
iand
iadd
istore_1            // count += (n & 1)

iload_0
iconst_1
iushr
istore_0            // n >>>= 1
goto LOOP

DONE:
iload_1
ireturn`,
  },

  {
    id: 'lc_231_power_of_two',
    name: 'LeetCode 231: Power of Two',
    category: 'leetcode',
    leetcodeId: 231,
    difficulty: 'Easy',
    tags: ['Bit Manipulation', 'Math'],
    className: 'PowerOfTwo',
    methodName: 'isPowerOfTwo',
    descriptor: '(I)I',
    description: 'Given an integer n, returns 1 if it is a power of two, and 0 otherwise. Uses bitwise trick: (n > 0) && ((n & (n - 1)) == 0).',
    defaultArgs: [16],
    argLabels: ['n (Integer)'],
    testCases: [
      { name: 'Test 1 (16)', args: [16], expected: 1, description: '16 is 2^4' },
      { name: 'Test 2 (3)', args: [3], expected: 0, description: '3 is not power of 2' },
      { name: 'Test 3 (64)', args: [64], expected: 1, description: '64 is 2^6' },
    ],
    maxStack: 3,
    maxLocals: 2,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'PowerOfTwo' }],
    javaSourceSnippet: `public static int isPowerOfTwo(int n) {
    if (n <= 0) return 0;
    return ((n & (n - 1)) == 0) ? 1 : 0;
}`,
    assemblySource: `// PowerOfTwo.isPowerOfTwo(n) -> LVT: 0=n
iload_0
iconst_0
if_icmple NOT_POWER // if n <= 0 return 0

iload_0
iload_0
iconst_1
isub
iand                // n & (n - 1)
ifeq IS_POWER

NOT_POWER:
iconst_0
ireturn

IS_POWER:
iconst_1
ireturn`,
  },

  {
    id: 'lc_268_missing_number',
    name: 'LeetCode 268: Missing Number',
    category: 'leetcode',
    leetcodeId: 268,
    difficulty: 'Easy',
    tags: ['Array', 'Math', 'Bit Manipulation'],
    className: 'MissingNumber',
    methodName: 'missingNumber',
    descriptor: '()I',
    description: 'Given an array [9, 6, 4, 2, 3, 5, 7, 0, 1] containing 9 distinct numbers in range [0, 9], finds the missing number 8 using the Gauss summation formula.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 (Missing 8 from 0..9)', args: [], expected: 8, description: 'Expected sum 45 - actual 37 = 8' },
    ],
    maxStack: 4,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'MissingNumber' }],
    javaSourceSnippet: `public static int missingNumber() {
    int[] nums = { 9, 6, 4, 2, 3, 5, 7, 0, 1 };
    int n = nums.length;
    int expectedSum = n * (n + 1) / 2;
    int actualSum = 0;
    for (int i = 0; i < n; i++) actualSum += nums[i];
    return expectedSum - actualSum;
}`,
    assemblySource: `// MissingNumber.missingNumber()
// LVT: 0=nums, 1=n, 2=expectedSum, 3=actualSum, 4=i
bipush 9
newarray 10
astore_0

// Fill nums = [9, 6, 4, 2, 3, 5, 7, 0, 1]
aload_0
iconst_0
bipush 9
iastore
aload_0
iconst_1
bipush 6
iastore
aload_0
iconst_2
iconst_4
iastore
aload_0
iconst_3
iconst_2
iastore
aload_0
iconst_4
iconst_3
iastore
aload_0
iconst_5
iconst_5
iastore
aload_0
bipush 6
bipush 7
iastore
aload_0
bipush 7
iconst_0
iastore
aload_0
bipush 8
iconst_1
iastore

bipush 9
istore_1            // n = 9

// expectedSum = n * (n + 1) / 2 = 9 * 10 / 2 = 45
iload_1
iload_1
iconst_1
iadd
imul
iconst_2
idiv
istore_2

iconst_0
istore_3            // actualSum = 0
iconst_0
istore 4            // i = 0

SUM_LOOP:
iload 4
iload_1
if_icmpge DONE

iload_3
aload_0
iload 4
iaload
iadd
istore_3

iinc 4 1
goto SUM_LOOP

DONE:
iload_2
iload_3
isub                // 45 - 37 = 8
ireturn`,
  },

  {
    id: 'lc_371_sum_integers',
    name: 'LeetCode 371: Sum of Two Integers',
    category: 'leetcode',
    leetcodeId: 371,
    difficulty: 'Medium',
    tags: ['Bit Manipulation'],
    className: 'BitwiseSum',
    methodName: 'getSum',
    descriptor: '(II)I',
    description: 'Computes the sum of two integers a and b WITHOUT using the operators + and -. Uses half-adder logic: sum = a ^ b, carry = (a & b) << 1.',
    defaultArgs: [15, 27],
    argLabels: ['a (First)', 'b (Second)'],
    testCases: [
      { name: 'Test 1 (15 + 27)', args: [15, 27], expected: 42, description: '15 + 27 = 42 without + operator' },
      { name: 'Test 2 (100 + 50)', args: [100, 50], expected: 150, description: '100 + 50 = 150' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'BitwiseSum' }],
    javaSourceSnippet: `public static int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1;
        a = a ^ b;
        b = carry;
    }
    return a;
}`,
    assemblySource: `// BitwiseSum.getSum(a, b) -> LVT: 0=a, 1=b, 2=carry
LOOP:
iload_1
ifeq DONE

// carry = (a & b) << 1
iload_0
iload_1
iand
iconst_1
ishl
istore_2

// a = a ^ b
iload_0
iload_1
ixor
istore_0

// b = carry
iload_2
istore_1
goto LOOP

DONE:
iload_0
ireturn`,
  },

  {
    id: 'lc_704_binary_search',
    name: 'LeetCode 704: Binary Search',
    category: 'leetcode',
    leetcodeId: 704,
    difficulty: 'Easy',
    tags: ['Binary Search', 'Array'],
    className: 'BinarySearch',
    methodName: 'search',
    descriptor: '(I)I',
    description: 'Searches for target inside sorted array [-1, 0, 3, 5, 9, 12] in O(log n) time. If target exists, returns its index, otherwise returns -1.',
    defaultArgs: [9],
    argLabels: ['target (Search Key)'],
    testCases: [
      { name: 'Test 1 (Target = 9)', args: [9], expected: 4, description: '9 is at index 4' },
      { name: 'Test 2 (Target = 2)', args: [2], expected: -1, description: '2 does not exist in array' },
      { name: 'Test 3 (Target = -1)', args: [-1], expected: 0, description: '-1 is at index 0' },
    ],
    maxStack: 5,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'BinarySearch' }],
    javaSourceSnippet: `public static int search(int target) {
    int[] nums = { -1, 0, 3, 5, 9, 12 };
    int low = 0, high = nums.length - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
    assemblySource: `// BinarySearch.search(target) -> LVT: 0=target, 1=nums, 2=low, 3=high, 4=mid, 5=midVal
bipush 6
newarray 10
astore_1

// Fill nums = [-1, 0, 3, 5, 9, 12]
aload_1
iconst_0
iconst_m1
iastore
aload_1
iconst_1
iconst_0
iastore
aload_1
iconst_2
iconst_3
iastore
aload_1
iconst_3
iconst_5
iastore
aload_1
iconst_4
bipush 9
iastore
aload_1
iconst_5
bipush 12
iastore

iconst_0
istore_2            // low = 0
iconst_5
istore_3            // high = 5

LOOP:
iload_2
iload_3
if_icmpgt NOT_FOUND

iload_2
iload_3
iadd
iconst_2
idiv
istore 4            // mid = (low + high) / 2

aload_1
iload 4
iaload
istore 5            // midVal = nums[mid]

iload 5
iload_0
if_icmpeq FOUND

iload 5
iload_0
if_icmpgt SEARCH_LEFT

iload 4
iconst_1
iadd
istore_2
goto LOOP

SEARCH_LEFT:
iload 4
iconst_1
isub
istore_3
goto LOOP

FOUND:
iload 4
ireturn

NOT_FOUND:
iconst_m1
ireturn`,
  },

  {
    id: 'lc_509_fibonacci',
    name: 'LeetCode 509: Fibonacci Number',
    category: 'leetcode',
    leetcodeId: 509,
    difficulty: 'Easy',
    tags: ['Math', 'Recursion'],
    className: 'Fibonacci',
    methodName: 'fib',
    descriptor: '(I)I',
    description: 'Computes F(n) via recursive invokestatic calls, demonstrating stack frame push/pop and operand return passing.',
    defaultArgs: [6],
    argLabels: ['n (Number)'],
    testCases: [
      { name: 'Test 1 (F(2))', args: [2], expected: 1, description: 'F(2) = 1' },
      { name: 'Test 2 (F(4))', args: [4], expected: 3, description: 'F(4) = 3' },
      { name: 'Test 3 (F(6))', args: [6], expected: 8, description: 'F(6) = 8' },
    ],
    maxStack: 4,
    maxLocals: 2,
    constantPool: [
      { index: 1, tag: 'CLASS_REF', value: 'Fibonacci' },
      { index: 2, tag: 'METHOD_REF', value: 'Fibonacci.fib', descriptor: '(I)I' },
    ],
    javaSourceSnippet: `public static int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}`,
    assemblySource: `// Fibonacci.fib(n) -> LVT: slot 0=n
iload_0
iconst_1
if_icmpgt RECURSION

iload_0
ireturn

RECURSION:
iload_0
iconst_1
isub
invokestatic 2

iload_0
iconst_2
isub
invokestatic 2

iadd
ireturn`,
  },

  {
    id: 'lc_7_reverse_integer',
    name: 'LeetCode 7: Reverse Integer',
    category: 'leetcode',
    leetcodeId: 7,
    difficulty: 'Medium',
    tags: ['Math'],
    className: 'ReverseInteger',
    methodName: 'reverse',
    descriptor: '(I)I',
    description: 'Reverses digits of an integer x. If reversing x causes 32-bit overflow, return 0.',
    defaultArgs: [12345],
    argLabels: ['x (Integer)'],
    testCases: [
      { name: 'Test 1 (12345)', args: [12345], expected: 54321, description: '12345 -> 54321' },
      { name: 'Test 2 (-321)', args: [-321], expected: -123, description: '-321 -> -123' },
      { name: 'Test 3 (120)', args: [120], expected: 21, description: '120 -> 21' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'ReverseInteger' }],
    javaSourceSnippet: `public static int reverse(int x) {
    int rev = 0;
    while (x != 0) {
        int pop = x % 10;
        x /= 10;
        rev = rev * 10 + pop;
    }
    return rev;
}`,
    assemblySource: `// ReverseInteger.reverse(x) -> LVT: 0=x, 1=rev, 2=pop
iconst_0
istore_1            // rev = 0

REV_LOOP:
iload_0
ifeq DONE           // while (x != 0)

iload_0
bipush 10
irem
istore_2            // pop = x % 10

iload_0
bipush 10
idiv
istore_0            // x /= 10

iload_1
bipush 10
imul
iload_2
iadd
istore_1            // rev = rev * 10 + pop
goto REV_LOOP

DONE:
iload_1
ireturn`,
  },

  {
    id: 'lc_27_remove_element',
    name: 'LeetCode 27: Remove Element',
    category: 'leetcode',
    leetcodeId: 27,
    difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'],
    className: 'RemoveElement',
    methodName: 'removeElement',
    descriptor: '(I)I',
    description: 'Removes all occurrences of val from heap array [3, 2, 2, 3] in-place. Returns number of remaining elements k.',
    defaultArgs: [3],
    argLabels: ['val (Value to remove)'],
    testCases: [
      { name: 'Test 1 (Remove 3)', args: [3], expected: 2, description: 'Array [3, 2, 2, 3] without 3 leaves [2, 2] of length 2' },
      { name: 'Test 2 (Remove 2)', args: [2], expected: 2, description: 'Array [3, 2, 2, 3] without 2 leaves [3, 3] of length 2' },
      { name: 'Test 3 (Remove 9)', args: [9], expected: 4, description: '9 not in array -> all 4 remain' },
    ],
    maxStack: 5,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'RemoveElement' }],
    javaSourceSnippet: `public static int removeElement(int val) {
    int[] nums = { 3, 2, 2, 3 };
    int k = 0;
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] != val) {
            nums[k] = nums[i];
            k++;
        }
    }
    return k;
}`,
    assemblySource: `// RemoveElement.removeElement(val)
// LVT: 0=val, 1=nums, 2=k, 3=i, 4=len
iconst_4
newarray 10
astore_1

// Fill nums = [3, 2, 2, 3]
aload_1
iconst_0
iconst_3
iastore
aload_1
iconst_1
iconst_2
iastore
aload_1
iconst_2
iconst_2
iastore
aload_1
iconst_3
iconst_3
iastore

iconst_0
istore_2            // k = 0
iconst_0
istore_3            // i = 0
iconst_4
istore 4            // len = 4

LOOP:
iload_3
iload 4
if_icmpge DONE

aload_1
iload_3
iaload
iload_0
if_icmpeq SKIP

aload_1
iload_2
aload_1
iload_3
iaload
iastore             // nums[k] = nums[i]
iinc 2 1            // k++

SKIP:
iinc 3 1            // i++
goto LOOP

DONE:
iload_2
ireturn`,
  },

  {
    id: 'lc_35_search_insert',
    name: 'LeetCode 35: Search Insert Position',
    category: 'leetcode',
    leetcodeId: 35,
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    className: 'SearchInsert',
    methodName: 'searchInsert',
    descriptor: '(I)I',
    description: 'Given a sorted array [1, 3, 5, 6] and a target, return index if found or index where it would be if inserted in order.',
    defaultArgs: [5],
    argLabels: ['target (Search value)'],
    testCases: [
      { name: 'Test 1 (Target = 5)', args: [5], expected: 2, description: '5 found at index 2' },
      { name: 'Test 2 (Target = 2)', args: [2], expected: 1, description: '2 should insert at index 1' },
      { name: 'Test 3 (Target = 7)', args: [7], expected: 4, description: '7 should insert at index 4' },
    ],
    maxStack: 4,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'SearchInsert' }],
    javaSourceSnippet: `public static int searchInsert(int target) {
    int[] nums = { 1, 3, 5, 6 };
    int low = 0, high = nums.length - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return low;
}`,
    assemblySource: `// SearchInsert.searchInsert(target)
// LVT: 0=target, 1=nums, 2=low, 3=high, 4=mid, 5=midVal
iconst_4
newarray 10
astore_1

aload_1
iconst_0
iconst_1
iastore
aload_1
iconst_1
iconst_3
iastore
aload_1
iconst_2
iconst_5
iastore
aload_1
iconst_3
bipush 6
iastore

iconst_0
istore_2            // low = 0
iconst_3
istore_3            // high = 3

BS_LOOP:
iload_2
iload_3
if_icmpgt NOT_FOUND

iload_2
iload_3
iadd
iconst_2
idiv
istore 4            // mid = (low + high) / 2

aload_1
iload 4
iaload
istore 5            // midVal = nums[mid]

iload 5
iload_0
if_icmpeq FOUND

iload 5
iload_0
if_icmpgt SEARCH_LEFT

iload 4
iconst_1
iadd
istore_2            // low = mid + 1
goto BS_LOOP

SEARCH_LEFT:
iload 4
iconst_1
isub
istore_3            // high = mid - 1
goto BS_LOOP

FOUND:
iload 4
ireturn

NOT_FOUND:
iload_2             // return low insert index
ireturn`,
  },

  {
    id: 'lc_66_plus_one',
    name: 'LeetCode 66: Plus One',
    category: 'leetcode',
    leetcodeId: 66,
    difficulty: 'Easy',
    tags: ['Array', 'Math'],
    className: 'PlusOne',
    methodName: 'plusOne',
    descriptor: '()I',
    description: 'Increments a large integer represented as digits [1, 2, 9] by one. Returns the integer value of the updated digits (130).',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Test 1 ([1, 2, 9] + 1)', args: [], expected: 130, description: '129 + 1 = 130' },
    ],
    maxStack: 5,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'PlusOne' }],
    javaSourceSnippet: `public static int plusOne() {
    int[] d = { 1, 2, 9 };
    for (int i = d.length - 1; i >= 0; i--) {
        if (d[i] < 9) {
            d[i]++;
            return d[0] * 100 + d[1] * 10 + d[2];
        }
        d[i] = 0;
    }
    return 1000;
}`,
    assemblySource: `// PlusOne.plusOne() -> LVT: 0=d, 1=i
iconst_3
newarray 10
astore_0

aload_0
iconst_0
iconst_1
iastore
aload_0
iconst_1
iconst_2
iastore
aload_0
iconst_2
bipush 9
iastore

iconst_2
istore_1            // i = 2

LOOP:
iload_1
iflt OVERFLOW

aload_0
iload_1
iaload
bipush 9
if_icmpeq CARRY

aload_0
iload_1
aload_0
iload_1
iaload
iconst_1
iadd
iastore             // d[i]++
goto ASSEMBLE_VAL

CARRY:
aload_0
iload_1
iconst_0
iastore             // d[i] = 0
iinc 1 -1
goto LOOP

ASSEMBLE_VAL:
aload_0
iconst_0
iaload
bipush 100
imul
aload_0
iconst_1
iaload
bipush 10
imul
iadd
aload_0
iconst_2
iaload
iadd
ireturn

OVERFLOW:
sipush 1000
ireturn`,
  },

  {
    id: 'lc_69_sqrt',
    name: 'LeetCode 69: Sqrt(x)',
    category: 'leetcode',
    leetcodeId: 69,
    difficulty: 'Easy',
    tags: ['Math', 'Binary Search'],
    className: 'IntegerSqrt',
    methodName: 'mySqrt',
    descriptor: '(I)I',
    description: 'Computes and returns the integer square root of non-negative integer x using binary search.',
    defaultArgs: [64],
    argLabels: ['x (Integer)'],
    testCases: [
      { name: 'Test 1 (sqrt(64))', args: [64], expected: 8, description: '8 * 8 = 64' },
      { name: 'Test 2 (sqrt(8))', args: [8], expected: 2, description: 'floor(sqrt(8)) = 2' },
      { name: 'Test 3 (sqrt(100))', args: [100], expected: 10, description: '10 * 10 = 100' },
    ],
    maxStack: 4,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'IntegerSqrt' }],
    javaSourceSnippet: `public static int mySqrt(int x) {
    if (x == 0 || x == 1) return x;
    int low = 1, high = x / 2, ans = 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (mid <= x / mid) {
            ans = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
}`,
    assemblySource: `// IntegerSqrt.mySqrt(x) -> LVT: 0=x, 1=low, 2=high, 3=ans, 4=mid
iload_0
iconst_1
if_icmple BASE

iconst_1
istore_1            // low = 1
iload_0
iconst_2
idiv
istore_2            // high = x / 2
iconst_1
istore_3            // ans = 1

LOOP:
iload_1
iload_2
if_icmpgt DONE

iload_1
iload_2
iadd
iconst_2
idiv
istore 4            // mid = (low + high) / 2

// check mid <= x / mid
iload_0
iload 4
idiv
iload 4
if_icmplt HIGH_DROP

iload 4
istore_3            // ans = mid
iload 4
iconst_1
iadd
istore_1            // low = mid + 1
goto LOOP

HIGH_DROP:
iload 4
iconst_1
isub
istore_2            // high = mid - 1
goto LOOP

BASE:
iload_0
ireturn

DONE:
iload_3
ireturn`,
  },

  {
    id: 'lc_122_stock_ii',
    name: 'LeetCode 122: Best Time to Buy and Sell Stock II',
    category: 'leetcode',
    leetcodeId: 122,
    difficulty: 'Medium',
    tags: ['Array', 'Greedy', 'Dynamic Programming'],
    className: 'StockII',
    methodName: 'maxProfit',
    descriptor: '()I',
    description: 'Finds maximum profit with multiple transactions on prices [7, 1, 5, 3, 6, 4]. Accumulates all positive daily differences.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Standard Prices', args: [], expected: 7, description: '(5 - 1) + (6 - 3) = 4 + 3 = 7' },
    ],
    maxStack: 4,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'StockII' }],
    javaSourceSnippet: `public static int maxProfit() {
    int[] prices = { 7, 1, 5, 3, 6, 4 };
    int totalProfit = 0;
    for (int i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) {
            totalProfit += prices[i] - prices[i - 1];
        }
    }
    return totalProfit;
}`,
    assemblySource: `// StockII.maxProfit() -> LVT: 0=prices, 1=profit, 2=i, 3=len
bipush 6
newarray 10
astore_0

aload_0
iconst_0
bipush 7
iastore
aload_0
iconst_1
iconst_1
iastore
aload_0
iconst_2
iconst_5
iastore
aload_0
iconst_3
iconst_3
iastore
aload_0
iconst_4
bipush 6
iastore
aload_0
iconst_5
iconst_4
iastore

iconst_0
istore_1            // profit = 0
iconst_1
istore_2            // i = 1
bipush 6
istore_3            // len = 6

LOOP:
iload_2
iload_3
if_icmpge DONE

aload_0
iload_2
iaload
aload_0
iload_2
iconst_1
isub
iaload
if_icmple NEXT_DAY

// profit += prices[i] - prices[i-1]
iload_1
aload_0
iload_2
iaload
aload_0
iload_2
iconst_1
isub
iaload
isub
iadd
istore_1

NEXT_DAY:
iinc 2 1
goto LOOP

DONE:
iload_1
ireturn`,
  },

  {
    id: 'lc_169_majority_element',
    name: 'LeetCode 169: Majority Element',
    category: 'leetcode',
    leetcodeId: 169,
    difficulty: 'Easy',
    tags: ['Array', 'Counting'],
    className: 'MajorityElement',
    methodName: 'majorityElement',
    descriptor: '()I',
    description: 'Finds the element that appears more than n/2 times in [2, 2, 1, 1, 1, 2, 2] using Boyer-Moore Voting Algorithm in O(1) space.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Majority of [2, 2, 1, 1, 1, 2, 2]', args: [], expected: 2, description: '2 appears 4 times out of 7' },
    ],
    maxStack: 4,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'MajorityElement' }],
    javaSourceSnippet: `public static int majorityElement() {
    int[] nums = { 2, 2, 1, 1, 1, 2, 2 };
    int candidate = 0, count = 0;
    for (int i = 0; i < nums.length; i++) {
        if (count == 0) candidate = nums[i];
        if (nums[i] == candidate) count++;
        else count--;
    }
    return candidate;
}`,
    assemblySource: `// MajorityElement.majorityElement()
// LVT: 0=nums, 1=candidate, 2=count, 3=i, 4=len
bipush 7
newarray 10
astore_0

// Fill [2, 2, 1, 1, 1, 2, 2]
aload_0
iconst_0
iconst_2
iastore
aload_0
iconst_1
iconst_2
iastore
aload_0
iconst_2
iconst_1
iastore
aload_0
iconst_3
iconst_1
iastore
aload_0
iconst_4
iconst_1
iastore
aload_0
iconst_5
iconst_2
iastore
aload_0
bipush 6
iconst_2
iastore

iconst_0
istore_1            // candidate = 0
iconst_0
istore_2            // count = 0
iconst_0
istore_3            // i = 0
bipush 7
istore 4            // len = 7

LOOP:
iload_3
iload 4
if_icmpge DONE

iload_2
ifne CHECK_MATCH
aload_0
iload_3
iaload
istore_1            // candidate = nums[i]

CHECK_MATCH:
aload_0
iload_3
iaload
iload_1
if_icmpne DECREMENT
iinc 2 1            // count++
goto NEXT

DECREMENT:
iinc 2 -1           // count--

NEXT:
iinc 3 1
goto LOOP

DONE:
iload_1
ireturn`,
  },

  {
    id: 'lc_198_house_robber',
    name: 'LeetCode 198: House Robber',
    category: 'leetcode',
    leetcodeId: 198,
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Array'],
    className: 'HouseRobber',
    methodName: 'rob',
    descriptor: '()I',
    description: 'Determines maximum money you can rob tonight without alerting the police (cannot rob adjacent houses) from [2, 7, 9, 3, 1].',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Houses [2, 7, 9, 3, 1]', args: [], expected: 12, description: 'Rob house 1 (2), house 3 (9), house 5 (1) -> 2 + 9 + 1 = 12' },
    ],
    maxStack: 4,
    maxLocals: 6,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'HouseRobber' }],
    javaSourceSnippet: `public static int rob() {
    int[] nums = { 2, 7, 9, 3, 1 };
    int prev1 = 0, prev2 = 0;
    for (int i = 0; i < nums.length; i++) {
        int temp = prev1;
        int take = prev2 + nums[i];
        prev1 = (take > prev1) ? take : prev1;
        prev2 = temp;
    }
    return prev1;
}`,
    assemblySource: `// HouseRobber.rob() -> LVT: 0=nums, 1=prev1, 2=prev2, 3=i, 4=len, 5=temp
iconst_5
newarray 10
astore_0

aload_0
iconst_0
iconst_2
iastore
aload_0
iconst_1
bipush 7
iastore
aload_0
iconst_2
bipush 9
iastore
aload_0
iconst_3
iconst_3
iastore
aload_0
iconst_4
iconst_1
iastore

iconst_0
istore_1            // prev1 = 0
iconst_0
istore_2            // prev2 = 0
iconst_0
istore_3            // i = 0
iconst_5
istore 4            // len = 5

LOOP:
iload_3
iload 4
if_icmpge DONE

iload_1
istore 5            // temp = prev1

// take = prev2 + nums[i]
iload_2
aload_0
iload_3
iaload
iadd

// max(take, prev1)
dup
iload_1
if_icmpgt UPDATE_PREV1
pop
iload_1
istore_1
goto ADVANCE

UPDATE_PREV1:
istore_1

ADVANCE:
iload 5
istore_2            // prev2 = temp
iinc 3 1
goto LOOP

DONE:
iload_1
ireturn`,
  },

  {
    id: 'lc_217_contains_duplicate',
    name: 'LeetCode 217: Contains Duplicate',
    category: 'leetcode',
    leetcodeId: 217,
    difficulty: 'Easy',
    tags: ['Array', 'Sorting'],
    className: 'ContainsDuplicate',
    methodName: 'containsDuplicate',
    descriptor: '()I',
    description: 'Returns 1 if any value appears at least twice in heap array [1, 2, 3, 1], and 0 if every element is distinct.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Array with duplicate [1, 2, 3, 1]', args: [], expected: 1, description: '1 is repeated at indices 0 and 3 -> returns 1 (true)' },
    ],
    maxStack: 4,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'ContainsDuplicate' }],
    javaSourceSnippet: `public static int containsDuplicate() {
    int[] nums = { 1, 2, 3, 1 };
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] == nums[j]) return 1;
        }
    }
    return 0;
}`,
    assemblySource: `// ContainsDuplicate.containsDuplicate()
// LVT: 0=nums, 1=n, 2=i, 3=j
iconst_4
newarray 10
astore_0

aload_0
iconst_0
iconst_1
iastore
aload_0
iconst_1
iconst_2
iastore
aload_0
iconst_2
iconst_3
iastore
aload_0
iconst_3
iconst_1
iastore

iconst_4
istore_1            // n = 4
iconst_0
istore_2            // i = 0

OUTER:
iload_2
iload_1
if_icmpge NO_DUP

iload_2
iconst_1
iadd
istore_3            // j = i + 1

INNER:
iload_3
iload_1
if_icmpge NEXT_OUTER

aload_0
iload_2
iaload
aload_0
iload_3
iaload
if_icmpeq DUP_FOUND

iinc 3 1
goto INNER

NEXT_OUTER:
iinc 2 1
goto OUTER

DUP_FOUND:
iconst_1
ireturn

NO_DUP:
iconst_0
ireturn`,
  },

  {
    id: 'lc_283_move_zeroes',
    name: 'LeetCode 283: Move Zeroes',
    category: 'leetcode',
    leetcodeId: 283,
    difficulty: 'Easy',
    tags: ['Array', 'Two Pointers'],
    className: 'MoveZeroes',
    methodName: 'moveZeroes',
    descriptor: '()I',
    description: 'Moves all 0s in [0, 1, 0, 3, 12] to the end while maintaining the relative order of non-zero elements. Returns first element.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Shift zeroes to end', args: [], expected: 1, description: 'Resulting array: [1, 3, 12, 0, 0] -> first element is 1' },
    ],
    maxStack: 5,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'MoveZeroes' }],
    javaSourceSnippet: `public static int moveZeroes() {
    int[] nums = { 0, 1, 0, 3, 12 };
    int insertPos = 0;
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] != 0) {
            nums[insertPos] = nums[i];
            insertPos++;
        }
    }
    while (insertPos < nums.length) {
        nums[insertPos] = 0;
        insertPos++;
    }
    return nums[0];
}`,
    assemblySource: `// MoveZeroes.moveZeroes() -> LVT: 0=nums, 1=pos, 2=i, 3=len
iconst_5
newarray 10
astore_0

aload_0
iconst_0
iconst_0
iastore
aload_0
iconst_1
iconst_1
iastore
aload_0
iconst_2
iconst_0
iastore
aload_0
iconst_3
iconst_3
iastore
aload_0
iconst_4
bipush 12
iastore

iconst_0
istore_1            // pos = 0
iconst_0
istore_2            // i = 0
iconst_5
istore_3            // len = 5

PASS1:
iload_2
iload_3
if_icmpge ZERO_FILL

aload_0
iload_2
iaload
ifeq SKIP_ZERO

aload_0
iload_1
aload_0
iload_2
iaload
iastore             // nums[pos] = nums[i]
iinc 1 1

SKIP_ZERO:
iinc 2 1
goto PASS1

ZERO_FILL:
iload_1
iload_3
if_icmpge DONE
aload_0
iload_1
iconst_0
iastore
iinc 1 1
goto ZERO_FILL

DONE:
aload_0
iconst_0
iaload              // return nums[0] (1)
ireturn`,
  },

  {
    id: 'lc_322_coin_change',
    name: 'LeetCode 322: Coin Change',
    category: 'leetcode',
    leetcodeId: 322,
    difficulty: 'Medium',
    tags: ['Dynamic Programming', 'Array'],
    className: 'CoinChange',
    methodName: 'coinChange',
    descriptor: '(I)I',
    description: 'Computes fewest number of coins needed from denominations [1, 2, 5] to make up amount using dynamic programming tabulation.',
    defaultArgs: [11],
    argLabels: ['amount (Target cents)'],
    testCases: [
      { name: 'Test 1 (Amount = 11)', args: [11], expected: 3, description: '5 + 5 + 1 = 11 -> 3 coins' },
      { name: 'Test 2 (Amount = 3)', args: [3], expected: 2, description: '2 + 1 = 3 -> 2 coins' },
      { name: 'Test 3 (Amount = 0)', args: [0], expected: 0, description: '0 coins needed for 0' },
    ],
    maxStack: 6,
    maxLocals: 8,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'CoinChange' }],
    javaSourceSnippet: `public static int coinChange(int amount) {
    if (amount <= 0) return 0;
    int[] coins = { 1, 2, 5 };
    int[] dp = new int[amount + 1];
    for (int i = 1; i <= amount; i++) dp[i] = 999;
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int c = 0; c < 3; c++) {
            if (coins[c] <= i) {
                int cand = dp[i - coins[c]] + 1;
                if (cand < dp[i]) dp[i] = cand;
            }
        }
    }
    return dp[amount] >= 999 ? -1 : dp[amount];
}`,
    assemblySource: `// CoinChange.coinChange(amount)
// LVT: 0=amount, 1=coins, 2=dp, 3=i, 4=c, 5=cand
iload_0
ifle ZERO_AMOUNT

iconst_3
newarray 10
astore_1
aload_1
iconst_0
iconst_1
iastore
aload_1
iconst_1
iconst_2
iastore
aload_1
iconst_2
iconst_5
iastore

iload_0
iconst_1
iadd
newarray 10
astore_2            // dp = new int[amount + 1]

// fill dp with 999
iconst_1
istore_3
INIT_DP:
iload_3
iload_0
if_icmpgt TABULATE
aload_2
iload_3
sipush 999
iastore
iinc 3 1
goto INIT_DP

TABULATE:
iconst_1
istore_3            // i = 1

OUTER:
iload_3
iload_0
if_icmpgt FINISH

iconst_0
istore 4            // c = 0

INNER:
iload 4
iconst_3
if_icmpge NEXT_I

aload_1
iload 4
iaload
iload_3
if_icmpgt NEXT_COIN

// cand = dp[i - coins[c]] + 1
aload_2
iload_3
aload_1
iload 4
iaload
isub
iaload
iconst_1
iadd
istore 5

// if cand < dp[i] -> dp[i] = cand
iload 5
aload_2
iload_3
iaload
if_icmpge NEXT_COIN

aload_2
iload_3
iload 5
iastore

NEXT_COIN:
iinc 4 1
goto INNER

NEXT_I:
iinc 3 1
goto OUTER

FINISH:
aload_2
iload_0
iaload
dup
sipush 999
if_icmplt RETURN_VAL
pop
iconst_m1
ireturn

RETURN_VAL:
ireturn

ZERO_AMOUNT:
iconst_0
ireturn`,
  },

  {
    id: 'lc_338_counting_bits',
    name: 'LeetCode 338: Counting Bits',
    category: 'leetcode',
    leetcodeId: 338,
    difficulty: 'Easy',
    tags: ['Bit Manipulation', 'Dynamic Programming'],
    className: 'CountingBits',
    methodName: 'countBitsSum',
    descriptor: '(I)I',
    description: 'Computes sum of number of 1 bits for every integer from 0 to n using DP formula: dp[i] = dp[i >> 1] + (i & 1).',
    defaultArgs: [5],
    argLabels: ['n (Integer upper bound)'],
    testCases: [
      { name: 'Test 1 (n = 5)', args: [5], expected: 7, description: 'bits(0)=0, (1)=1, (2)=1, (3)=2, (4)=1, (5)=2 -> sum = 7' },
      { name: 'Test 2 (n = 2)', args: [2], expected: 2, description: '0 + 1 + 1 = 2' },
    ],
    maxStack: 5,
    maxLocals: 5,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'CountingBits' }],
    javaSourceSnippet: `public static int countBitsSum(int n) {
    int[] dp = new int[n + 1];
    int total = 0;
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i >> 1] + (i & 1);
        total += dp[i];
    }
    return total;
}`,
    assemblySource: `// CountingBits.countBitsSum(n) -> LVT: 0=n, 1=dp, 2=total, 3=i
iload_0
iconst_1
iadd
newarray 10
astore_1

iconst_0
istore_2            // total = 0
iconst_1
istore_3            // i = 1

LOOP:
iload_3
iload_0
if_icmpgt DONE

// dp[i] = dp[i >> 1] + (i & 1)
aload_1
iload_3

aload_1
iload_3
iconst_1
ishr
iaload
iload_3
iconst_1
iand
iadd

iastore

// total += dp[i]
iload_2
aload_1
iload_3
iaload
iadd
istore_2

iinc 3 1
goto LOOP

DONE:
iload_2
ireturn`,
  },
  // ==========================================

  {
    id: 'factorial',
    name: 'Iterative Factorial',
    category: 'math',
    className: 'Factorial',
    methodName: 'compute',
    descriptor: '(I)I',
    description: 'Computes n! using loops, conditional branching (if_icmpgt), and integer multiplication.',
    defaultArgs: [5],
    argLabels: ['n (Integer)'],
    testCases: [
      { name: 'Test 1 (5!)', args: [5], expected: 120, description: '5! = 120' },
      { name: 'Test 2 (6!)', args: [6], expected: 720, description: '6! = 720' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [
      { index: 1, tag: 'CLASS_REF', value: 'Factorial' },
      { index: 2, tag: 'UTF8', value: 'compute' },
      { index: 3, tag: 'UTF8', value: '(I)I' },
    ],
    javaSourceSnippet: `public static int compute(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}`,
    assemblySource: `// Factorial.compute(n) -> LVT: slot 0=n, slot 1=result, slot 2=i
iconst_1
istore_1
iconst_2
istore_2

LOOP_HEADER:
iload_2
iload_0
if_icmpgt LOOP_END

iload_1
iload_2
imul
istore_1

iinc 2 1
goto LOOP_HEADER

LOOP_END:
iload_1
ireturn`,
  },

  {
    id: 'gcd',
    name: 'Euclidean GCD',
    category: 'math',
    className: 'GCD',
    methodName: 'compute',
    descriptor: '(II)I',
    description: 'Calculates the Greatest Common Divisor of two integers using remainder arithmetic (irem) and loop jumps.',
    defaultArgs: [48, 18],
    argLabels: ['a (First)', 'b (Second)'],
    testCases: [
      { name: 'Test 1 (48, 18)', args: [48, 18], expected: 6, description: 'GCD(48, 18) = 6' },
      { name: 'Test 2 (101, 10)', args: [101, 10], expected: 1, description: 'Coprime numbers GCD = 1' },
    ],
    maxStack: 4,
    maxLocals: 4,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'GCD' }],
    javaSourceSnippet: `public static int compute(int a, int b) {
    while (b != 0) {
        int temp = a % b;
        a = b;
        b = temp;
    }
    return a;
}`,
    assemblySource: `// GCD.compute(a, b) -> LVT: 0=a, 1=b, 2=temp
LOOP:
iload_1
ifeq DONE

iload_0
iload_1
irem
istore_2

iload_1
istore_0

iload_2
istore_1

goto LOOP

DONE:
iload_0
ireturn`,
  },

  {
    id: 'ackermann',
    name: 'Ackermann Function',
    category: 'recursion',
    className: 'Ackermann',
    methodName: 'ack',
    descriptor: '(II)I',
    description: 'Computes the highly recursive Ackermann function A(m, n) showcasing deep nesting of JVM stack frames.',
    defaultArgs: [2, 2],
    argLabels: ['m (First)', 'n (Second)'],
    maxStack: 4,
    maxLocals: 2,
    constantPool: [
      { index: 1, tag: 'CLASS_REF', value: 'Ackermann' },
      { index: 2, tag: 'METHOD_REF', value: 'Ackermann.ack', descriptor: '(II)I' },
    ],
    javaSourceSnippet: `public static int ack(int m, int n) {
    if (m == 0) return n + 1;
    if (n == 0) return ack(m - 1, 1);
    return ack(m - 1, ack(m, n - 1));
}`,
    assemblySource: `// Ackermann.ack(m, n) -> LVT: 0=m, 1=n
iload_0
ifne M_GREATER_THAN_ZERO

iload_1
iconst_1
iadd
ireturn

M_GREATER_THAN_ZERO:
iload_1
ifne RECURSE_BOTH

iload_0
iconst_1
isub
iconst_1
invokestatic 2
ireturn

RECURSE_BOTH:
iload_0
iconst_1
isub

iload_0
iload_1
iconst_1
isub
invokestatic 2

invokestatic 2
ireturn`,
  },

  {
    id: 'stack_calc',
    name: 'Stack Math & Expression Evaluation',
    category: 'math',
    className: 'StackCalc',
    methodName: 'evaluate',
    descriptor: '()I',
    description: 'Complex arithmetic expression evaluation: ((15 * 4) + (100 - 25)) / 5 with dup, swap, and stack operations.',
    defaultArgs: [],
    argLabels: [],
    testCases: [
      { name: 'Expression result', args: [], expected: 27, description: '((60) + (75)) / 5 = 27' },
    ],
    maxStack: 6,
    maxLocals: 2,
    constantPool: [{ index: 1, tag: 'CLASS_REF', value: 'StackCalc' }],
    javaSourceSnippet: `public static int evaluate() {
    int term1 = 15 * 4;   // 60
    int term2 = 100 - 25; // 75
    return (term1 + term2) / 5; // 135 / 5 = 27
}`,
    assemblySource: `// Stack evaluation: ((15 * 4) + (100 - 25)) / 5
bipush 15
iconst_4
imul
bipush 100
bipush 25
isub
iadd
iconst_5
idiv
dup
pop
ireturn`,
  },
];

export function buildSampleMetadata(sample: SampleProgramDef): MethodMetadata {
  const { bytecode, instructions } = BytecodeParser.assemble(sample.assemblySource);
  return {
    className: sample.className,
    methodName: sample.methodName,
    descriptor: sample.descriptor,
    maxStack: Math.max(sample.maxStack, 8),
    maxLocals: Math.max(sample.maxLocals, 8),
    bytecode,
    instructions,
  };
}

export const CUSTOM_PROBLEMS_STORAGE_KEY = 'jvm_custom_leetcode_problems';

export function getCustomLeetCodeProblems(): SampleProgramDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PROBLEMS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomLeetCodeProblem(problem: SampleProgramDef): void {
  try {
    const existing = getCustomLeetCodeProblems();
    const idx = existing.findIndex((p) => p.id === problem.id);
    let updated: SampleProgramDef[];
    if (idx !== -1) {
      updated = [...existing];
      updated[idx] = problem;
    } else {
      updated = [problem, ...existing];
    }
    localStorage.setItem(CUSTOM_PROBLEMS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function deleteCustomLeetCodeProblem(id: string): void {
  try {
    const existing = getCustomLeetCodeProblems();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(CUSTOM_PROBLEMS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

