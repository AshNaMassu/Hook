using UnityEngine;

public class HookHero : MonoBehaviour
{
    public Profile profile;

    public bool Attached { get; private set; }
    public Vector2 AnchorPos => anchor;

    Vector2 anchor, vel;
    float theta, omega, r;
    int spinDir;

    void Update()
    {
        if (Input.GetMouseButtonDown(0)) Press();
        else if (Input.GetMouseButtonUp(0)) Release();

        if (Attached)
        {
            omega = Mathf.Min(profile.wMax, omega + profile.spinAccel * Time.deltaTime);
            theta += spinDir * omega * Time.deltaTime;
            Vector2 newPos = anchor + new Vector2(Mathf.Cos(theta), Mathf.Sin(theta)) * r;
            transform.position = new Vector3(newPos.x, newPos.y, transform.position.z);
        }
        else
        {
            vel.y -= profile.g * Time.deltaTime;
            transform.position += new Vector3(vel.x, vel.y, 0) * Time.deltaTime;
        }
    }

    void Press()
    {
        if (Attached) return;
        var a = Anchor.FindNearest(transform.position, profile.grabRadius);
        if (a == null)
        {
            Debug.Log($"[Hook] MISS: nearest={NearestDist():F2} > radius={profile.grabRadius}");
            return;
        }

        Attached = true;
        anchor = a.Pos;
        var d = (Vector2)transform.position - anchor;
        r = Mathf.Clamp(d.magnitude, profile.rMin, profile.rMax);
        theta = Mathf.Atan2(d.y, d.x);

        float w = Vector2.Dot(vel, Tangent(theta)) / r;
        spinDir = Mathf.Abs(w) > 1f ? (w > 0 ? 1 : -1) : DefaultDir(a);
        if (Mathf.Abs(w) < profile.wMin) w = profile.wMin * spinDir; // пол: не висим
        omega = Mathf.Clamp(w, -profile.wMax, profile.wMax);         // потолок окна

        Debug.Log($"[Hook] GRAB: r={r:F2} omega={omega:F2} dir={spinDir}");
    }

    void Release()
    {
        if (!Attached) return;
        Attached = false;
        vel = Tangent(theta) * (spinDir * omega * r) + Vector2.up * profile.upAssist;
        Debug.Log($"[Hook] RELEASE: vel={vel.ToString("F1")}");
    }

    int DefaultDir(Anchor current)
    {
        Anchor best = null; float bestD = float.MaxValue;
        foreach (var o in FindObjectsOfType<Anchor>())
        {
            if (o == current) continue;
            float d = Vector2.Distance(o.Pos, current.Pos);
            if (d < bestD) { bestD = d; best = o; }
        }
        return best != null && best.Pos.x < current.Pos.x ? -1 : 1;
    }

    public static Vector2 Tangent(float th) => new Vector2(-Mathf.Sin(th), Mathf.Cos(th));

    public void Respawn(Vector2 pos)
    {
        Attached = false;
        vel = Vector2.zero;
        transform.position = pos;
    }

    float NearestDist()
    {
        float d = float.MaxValue;
        foreach (var a in FindObjectsOfType<Anchor>())
            d = Mathf.Min(d, Vector2.Distance(a.Pos, (Vector2)transform.position));
        return d;
    }

    void OnGUI()
    {
        GUI.Label(new Rect(10, 10, 600, 140),
            $"attached={Attached}\nnearest={NearestDist():F2}  (radius={profile.grabRadius})\nomega={omega:F2}  r={(Attached ? r : 0):F2}");
    }

    void OnDrawGizmos()
    {
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, profile ? profile.grabRadius : 1f);
    }
}