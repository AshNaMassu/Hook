using UnityEngine;

public static class Reachability
{
    public static bool FlightHits(Vector2 p, Vector2 v, Vector2 target, Profile pf,
                                  float dt = 0.05f, int steps = 30)
    {
        for (int i = 0; i < steps; i++)
        {
            v.y -= pf.g * dt;
            p += v * dt;
            if ((p - target).sqrMagnitude < pf.grabRadius * pf.grabRadius) return true;
        }
        return false;
    }

    public static Vector2 PlaceNext(Vector2 a, int side, float diff, System.Random rng, Profile pf)
    {
        float th = side > 0 ? 5.4978f : 3.927f;               // 315° / 225°
        int sd = side > 0 ? 1 : -1;
        float r = (pf.rMin + pf.rMax) * 0.5f;
        float w = Mathf.Lerp(pf.wMin, pf.wMax, 0.6f);

        var pos = a + new Vector2(Mathf.Cos(th), Mathf.Sin(th)) * r;
        var vel = HookHero.Tangent(th) * (sd * w * r);
        vel.y += pf.upAssist;

        float T = Mathf.Lerp(0.55f, 0.9f, (float)rng.NextDouble());
        for (float t = 0; t < T; t += 0.05f) { vel.y -= pf.g * 0.05f; pos += vel * 0.05f; }
        return pos;
    }
}