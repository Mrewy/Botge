/** @format */

import { exec, type ExecException } from 'node:child_process';

export const DEFAULT_DURATION = 0 as const;

export async function getDimension(
  filename: string
): Promise<readonly [number, number] | undefined> {
  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${filename}`,
      (error: ExecException | null, stdout) => {
        if (error) {
          resolve(undefined);
          return;
        }
        const widthAndHeight = stdout.trim();

        if (widthAndHeight === 'N/A' || widthAndHeight === '') {
          resolve(undefined);
        } else {
          const widthAndHeightSplit: readonly string[] = widthAndHeight.split('x');
          const width = Number(widthAndHeightSplit[0]);
          const height = Number(widthAndHeightSplit[1]);

          resolve([width, height]);
        }
      }
    );
  });
}

export async function getDuration(filename: string): Promise<number | undefined> {
  let filename_ = filename;
  if (filename.startsWith('http://') || filename.startsWith('https://'))
    filename_ = `cache:${filename}`;

  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 "${filename_}"`,
      (error: ExecException | null, stdout) => {
        if (error) {
          resolve(undefined);
          return;
        }
        const duration = stdout.trim();
        // Check if duration is "N/A" or empty, and use a default value
        if (duration === 'N/A' || duration === '') {
          resolve(parseFloat(String(DEFAULT_DURATION)));
          // ? reject(new Error('Duration is either N/A or empty.')); // or any default value you prefer
        } else {
          resolve(parseFloat(duration));
        }
      }
    );
  });
}
