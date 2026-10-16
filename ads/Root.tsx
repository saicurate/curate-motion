import React from "react";
import { Composition, Folder } from "remotion";
import { compositionId, FORMATS, fpsFor } from "../schemas/ad";
import { ADS } from "./registry";

// One composition per ad × format × length: <ad-id>--<format>--<length>s (e.g. meet-zee--9x16--15s).
// Props are validated by each ad's zod schema, so Studio shows them as editable controls.
// An ad with `metadata` (e.g. a voiced explainer) sets its own length from its props.
// fps: the ad's (60 for new ads), except App Store previews, which always render at 30.
export const RemotionRoot: React.FC = () => (
  <>
    {ADS.map(({ spec, component, schema, defaults, metadata }) => (
      <Folder key={spec.id} name={spec.id}>
        {spec.formats.flatMap((format) =>
          spec.lengths.map((length) => (
            <Composition
              key={`${format}-${length}`}
              id={compositionId(spec.id, format, length)}
              component={component}
              schema={schema}
              defaultProps={{ ...defaults, format, length }}
              fps={fpsFor(spec.fps, format)}
              width={FORMATS[format].width}
              height={FORMATS[format].height}
              durationInFrames={length * fpsFor(spec.fps, format)}
              calculateMetadata={metadata ? ({ props }) => metadata(props) : undefined}
            />
          )),
        )}
      </Folder>
    ))}
  </>
);
